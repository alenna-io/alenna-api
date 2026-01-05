import { SchoolYear, SchoolYearStatus } from '../../../../domain/entities/v2/SchoolYear';

export class SchoolYearMapper {
  static toDomain(raw: any): SchoolYear {
    return new SchoolYear(
      raw.id,
      raw.schoolId,
      raw.name,
      raw.startDate,
      raw.endDate,
      raw.status as SchoolYearStatus,
      raw.createdAt,
      raw.updatedAt,
    );
  }
}