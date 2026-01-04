import { PaceCatalog } from '../../../domain/entities';
import { PaceCatalog as PrismaPaceCatalog } from '@prisma/client';

export class PaceCatalogMapper {
  static toDomain(paceCatalog: PrismaPaceCatalog): PaceCatalog {
    return new PaceCatalog(
      paceCatalog.id,
      paceCatalog.code,
      paceCatalog.name,
      paceCatalog.subSubjectId,
      paceCatalog.createdAt,
      paceCatalog.updatedAt
    );
  }
  static toPrisma(paceCatalog: PaceCatalog): Omit<PrismaPaceCatalog, 'createdAt' | 'updatedAt'> {
    return {
      id: paceCatalog.id,
      code: paceCatalog.code,
      name: paceCatalog.name,
      subSubjectId: paceCatalog.subSubjectId,
    };
  }
}

