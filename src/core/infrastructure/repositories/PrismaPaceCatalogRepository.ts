import { PrismaTransaction } from '../database/PrismaTransaction';
import prisma from '../database/prisma.client';
import { Prisma } from '@prisma/client';
import { IPaceCatalogRepository } from '../../domain/interfaces/repositories/IPaceCatalogRepository';

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

    const boundaries = await tx.paceCatalog.findMany({
      where: {
        code: { in: [String(startPace), String(endPace)] },
        subject: { categoryId },
      },
      select: { orderIndex: true, code: true },
    });

    if (boundaries.length === 0) {
      throw new Error(`No paces found with codes ${startPace} or ${endPace} in category ${categoryId}`);
    }

    const foundCodes = boundaries.map(b => b.code);
    const missingCodes: string[] = [];
    if (!foundCodes.includes(String(startPace))) {
      missingCodes.push(String(startPace));
    }
    if (!foundCodes.includes(String(endPace))) {
      missingCodes.push(String(endPace));
    }

    if (missingCodes.length > 0) {
      throw new Error(`Pace codes ${missingCodes.join(', ')} not found in category ${categoryId}`);
    }

    const start = Math.min(...boundaries.map(b => b.orderIndex));
    const end = Math.max(...boundaries.map(b => b.orderIndex));

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      throw new Error(`Invalid orderIndex values calculated for pace range ${startPace}-${endPace} in category ${categoryId}`);
    }

    return tx.paceCatalog.findMany({
      where: {
        subject: { categoryId },
        orderIndex: { gte: start, lte: end },
      },
      include: { subject: true },
    });
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
