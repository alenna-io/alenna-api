import { StudentScholarship as PrismaStudentScholarship } from '@prisma/client';
import { StudentScholarship, ScholarshipType } from '../../../domain/entities';

export class StudentScholarshipMapper {
  static toDomain(prismaScholarship: PrismaStudentScholarship): StudentScholarship {
    return new StudentScholarship(
      prismaScholarship.id,
      prismaScholarship.studentId,
      prismaScholarship.tuitionTypeId ?? null,
      prismaScholarship.scholarshipType as ScholarshipType | null,
      prismaScholarship.scholarshipValue ? Number(prismaScholarship.scholarshipValue) : null,
      prismaScholarship.createdAt,
      prismaScholarship.updatedAt
    );
  }

  static toPrisma(scholarship: StudentScholarship): Omit<PrismaStudentScholarship, 'createdAt' | 'updatedAt'> {
    return {
      id: scholarship.id,
      studentId: scholarship.studentId,
      tuitionTypeId: scholarship.tuitionTypeId,
      scholarshipType: scholarship.scholarshipType,
      scholarshipValue: scholarship.scholarshipValue,
    };
  }
}

