import { PaceCatalogRepository } from '../../../../adapters_interface/repositories/v2';
import { PaceCatalog } from '../../../../domain/entities/v2/PaceCatalog';
import { PaceCatalogMapper } from '../../mappers/v2/PaceCataolgMapper';
import { PrismaTransaction } from '../../PrismaTransaction';
import prisma from '../../prisma.client';

export class PrismaPaceCatalogRepository implements PaceCatalogRepository {
  async findByCodeAndSubSubjectId(
    code: string,
    subSubjectId: string,
    tx: PrismaTransaction = prisma
  ): Promise<PaceCatalog | null> {
    const paceCatalog = await tx.paceCatalog.findFirst({
      where: { code, subSubjectId },
    });
    return paceCatalog ? PaceCatalogMapper.toDomain(paceCatalog) : null;
  }

  async findByCodesAndSubSubjects(
    codes: string[],
    subSubjectIds: string[],
    tx: PrismaTransaction = prisma
  ): Promise<Map<string, PaceCatalog>> {
    const paceCatalogs = await tx.paceCatalog.findMany({
      where: {
        AND: [
          { code: { in: codes } },
          { subSubjectId: { in: subSubjectIds } },
        ],
      },
    });

    const paceCatalogMap = new Map<string, PaceCatalog>();
    for (const paceCatalog of paceCatalogs) {
      paceCatalogMap.set(`${paceCatalog.subSubjectId}:${paceCatalog.code}`, PaceCatalogMapper.toDomain(paceCatalog));
    }
    return paceCatalogMap;
  }

  async findByCategoryAndOrderRange(
    categoryId: string,
    startPace: number,
    endPace: number,
    tx: PrismaTransaction = prisma
  ): Promise<PaceCatalog[]> {

    const boundaries = await tx.paceCatalog.findMany({
      where: {
        code: { in: [String(startPace), String(endPace)] },
        subSubject: { categoryId },
      },
      select: { orderIndex: true },
    });

    const start = Math.min(...boundaries.map(b => b.orderIndex));
    const end = Math.max(...boundaries.map(b => b.orderIndex));

    return tx.paceCatalog.findMany({
      where: {
        subSubject: { categoryId },
        orderIndex: { gte: start, lte: end },
      },
      include: { subSubject: true },
    });
  }
}