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
      select: { orderIndex: true },
    });

    const start = Math.min(...boundaries.map(b => b.orderIndex));
    const end = Math.max(...boundaries.map(b => b.orderIndex));

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
