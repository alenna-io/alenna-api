import { School } from '../../../../domain/entities/v2/School';

export class SchoolMapper {
  static toDomain(raw: any): School {
    return new School(
      raw.id,
      raw.name,
      raw.address,
      raw.phone,
      raw.email,
      raw.logoUrl,
      raw.teacherLimit,
      raw.userLimit,
    );
  }
}