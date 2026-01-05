import { Student, StudentStatus } from '../../../../domain/entities/v2/Student';

export class StudentMapper {
  static toDomain(raw: any): Student {
    return new Student(
      raw.id,
      raw.userId,
      raw.schoolId,
      raw.birthDate,
      raw.graduationDate,
      raw.status as StudentStatus,
      raw.certificationTypeId,
      raw.expectedLevel ?? undefined, // convert null → undefined
      raw.currentLevel ?? undefined,  // convert null → undefined
      raw.createdAt,
      raw.updatedAt,
    );
  }
}