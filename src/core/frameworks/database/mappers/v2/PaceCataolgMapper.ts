import { PaceCatalog } from '../../../../domain/entities/v2/PaceCatalog';

export class PaceCatalogMapper {
  static toDomain(raw: any): PaceCatalog {
    return new PaceCatalog(
      raw.id,
      raw.code,
      raw.name,
      raw.subSubjectId,
    );
  }
}