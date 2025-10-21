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
}

