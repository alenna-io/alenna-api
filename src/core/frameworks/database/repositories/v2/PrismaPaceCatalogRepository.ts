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
}