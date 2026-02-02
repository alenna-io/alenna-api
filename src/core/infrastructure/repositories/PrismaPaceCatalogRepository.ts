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
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.PaceCatalogGetPayload<{ include: { subject: true } }>[]> {
    // Normalize the input pace codes (remove leading zeros)
    const normalizedStartPace = normalizePaceCode(startPace);
    const normalizedEndPace = normalizePaceCode(endPace);

    // Fetch all paces in the category to find matches by normalized code
    const allPaces = await tx.paceCatalog.findMany({
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

    // Find boundaries by comparing normalized codes
    const startBoundary = allPaces.find(p => normalizePaceCode(p.code) === normalizedStartPace);
    const endBoundary = allPaces.find(p => normalizePaceCode(p.code) === normalizedEndPace);

    if (!startBoundary) {
      throw new Error(`Pace code ${startPace} not found in category ${categoryId}`);
    }

    if (!endBoundary) {
      throw new Error(`Pace code ${endPace} not found in category ${categoryId}`);
    }

    const startOrderIndex = startBoundary.orderIndex;
    const endOrderIndex = endBoundary.orderIndex;

    if (!Number.isFinite(startOrderIndex) || !Number.isFinite(endOrderIndex)) {
      throw new Error(`Invalid orderIndex values calculated for pace range ${startPace}-${endPace} in category ${categoryId}`);
    }

    // Fetch all paces within the orderIndex range
    const pacesInRange = await tx.paceCatalog.findMany({
      where: {
        subject: { categoryId },
        orderIndex: { gte: startOrderIndex, lte: endOrderIndex },
      },
      include: { subject: true },
    });

    return pacesInRange;
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
