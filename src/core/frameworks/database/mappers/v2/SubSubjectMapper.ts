import { SubSubject } from '../../../../domain/entities/v2/SubSubject';

export class SubSubjectMapper {
  static toDomain(raw: any): SubSubject {
    return new SubSubject(
      raw.id,
      raw.name,
      raw.difficulty,
      raw.categoryId,
      raw.levelId,
    );
  }
}