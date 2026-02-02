import { PrismaTransaction } from '../database/PrismaTransaction';
import prisma from '../database/prisma.client';
import { Prisma } from '@prisma/client';
import { IPaceCatalogRepository } from '../../domain/interfaces/repositories/IPaceCatalogRepository';

/**
 * Normalizes pace code by removing leading zeros for comparison
 * e.g., "001" -> "1", "012" -> "12"
 */
function normalizePaceCode(code: string | number): string {
  return String(parseInt(String(code), 10));
}

export class PrismaPaceCatalogRepository implements IPaceCatalogRepository {
  async findById(
    id: string,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.PaceCatalogGetPayload<{ include: { subject: { include: { category: true } } } }> | null> {
    return await tx.paceCatalog.findUnique({
      where: { id },
      include: {
        subject: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  async findByCodeAndSubjectId(
    code: string,
    subjectId: string,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.PaceCatalogGetPayload<{}> | null> {
    return await tx.paceCatalog.findFirst({
      where: { code, subjectId },
    });
  }

  async findByCodesAndSubjects(
    codes: string[],
    subjectIds: string[],
    tx: PrismaTransaction = prisma
  ): Promise<Map<string, Prisma.PaceCatalogGetPayload<{}>>> {
    const paceCatalogs = await tx.paceCatalog.findMany({
      where: {
        AND: [
          { code: { in: codes } },
          { subjectId: { in: subjectIds } },
        ],
      },
    });

    const paceCatalogMap = new Map<string, Prisma.PaceCatalogGetPayload<{}>>();
    for (const paceCatalog of paceCatalogs) {
      paceCatalogMap.set(`${paceCatalog.subjectId}:${paceCatalog.code}`, paceCatalog);
    }
    return paceCatalogMap;
  }

  async findByCategoryAndOrderRange(
    categoryId: string,
    startPace: number,
    endPace: number,
    subjectId: string,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.PaceCatalogGetPayload<{ include: { subject: true } }>[]> {
    // Normalize the input pace codes (remove leading zeros)
    const normalizedStartPace = normalizePaceCode(startPace);
    const normalizedEndPace = normalizePaceCode(endPace);

    // Check if this is the Electives category
    const category = await tx.category.findUnique({
      where: { id: categoryId },
      select: { name: true },
    });
    const isElectives = category?.name === 'Electives';

    // For Electives: must stay within the specified subject (orderIndex is not unique across subjects)
    // For non-Electives: can span multiple subjects within the category (orderIndex is continuous across subjects)

    if (isElectives) {
      // Fetch all paces for the specific subject to find matches by normalized code
      const allPaces = await tx.paceCatalog.findMany({
        where: {
          subject: { categoryId },
          subjectId: subjectId,
        },
        select: {
          id: true,
          code: true,
          orderIndex: true,
          subjectId: true,
          categoryId: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const startBoundary = allPaces.find(p => normalizePaceCode(p.code) === normalizedStartPace);
      const endBoundary = allPaces.find(p => normalizePaceCode(p.code) === normalizedEndPace);

      if (!startBoundary) {
        throw new Error(`Pace code ${startPace} not found for subject ${subjectId} in category ${categoryId}`);
      }

      if (!endBoundary) {
        throw new Error(`Pace code ${endPace} not found for subject ${subjectId} in category ${categoryId}`);
      }

      const startOrderIndex = startBoundary.orderIndex;
      const endOrderIndex = endBoundary.orderIndex;

      if (!Number.isFinite(startOrderIndex) || !Number.isFinite(endOrderIndex)) {
        throw new Error(`Invalid orderIndex values calculated for pace range ${startPace}-${endPace} for subject ${subjectId} in category ${categoryId}`);
      }

      // For Electives, fetch only from the specified subject
      const pacesInRange = await tx.paceCatalog.findMany({
        where: {
          subject: { categoryId },
          subjectId: subjectId,
          orderIndex: { gte: startOrderIndex, lte: endOrderIndex },
        },
        include: { subject: true },
      });

      return pacesInRange;
    } else {
      // For non-Electives: allow spanning multiple subjects within the category
      // First, find the start pace in the specified subject (must exist there)
      const startSubjectPaces = await tx.paceCatalog.findMany({
        where: {
          subject: { categoryId },
          subjectId: subjectId,
        },
        select: {
          id: true,
          code: true,
          orderIndex: true,
          subjectId: true,
          categoryId: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const startBoundary = startSubjectPaces.find(p => normalizePaceCode(p.code) === normalizedStartPace);
      if (!startBoundary) {
        throw new Error(`Pace code ${startPace} not found for subject ${subjectId} in category ${categoryId}`);
      }

      // Then, find the end pace anywhere in the category (can be in a different subject)
      const allCategoryPaces = await tx.paceCatalog.findMany({
        where: {
          subject: { categoryId },
        },
        select: {
          id: true,
          code: true,
          orderIndex: true,
          subjectId: true,
          categoryId: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const endBoundary = allCategoryPaces.find(p => normalizePaceCode(p.code) === normalizedEndPace);
      if (!endBoundary) {
        throw new Error(`Pace code ${endPace} not found in category ${categoryId}`);
      }

      const startOrderIndex = startBoundary.orderIndex;
      const endOrderIndex = endBoundary.orderIndex;

      if (!Number.isFinite(startOrderIndex) || !Number.isFinite(endOrderIndex)) {
        throw new Error(`Invalid orderIndex values calculated for pace range ${startPace}-${endPace} in category ${categoryId}`);
      }

      // Fetch all paces within the orderIndex range across the entire category
      // (not restricted to a single subject, allowing spans across multiple subjects)
      const pacesInRange = await tx.paceCatalog.findMany({
        where: {
          subject: { categoryId },
          orderIndex: { gte: startOrderIndex, lte: endOrderIndex },
        },
        include: { subject: true },
      });

      return pacesInRange;
    }
  }

  async findByCategory(
    categoryName: string,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.PaceCatalogGetPayload<{ include: { subject: { include: { category: true; level: true } } } }>[]> {
    return await tx.paceCatalog.findMany({
      where: {
        subject: {
          category: {
            name: categoryName,
          },
        },
      },
      include: {
        subject: {
          include: {
            category: true,
            level: true,
          },
        },
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });
  }
}
