import { Student as PrismaStudent, Parent as PrismaParent } from '@prisma/client';
import { Student, CertificationType } from '../../../domain/entities';

type PrismaStudentWithParents = PrismaStudent & {
  parents?: PrismaParent[];
};

export class StudentMapper {
  static toDomain(prismaStudent: PrismaStudentWithParents): Student {
    return new Student(
      prismaStudent.id,
      prismaStudent.firstName,
      prismaStudent.lastName,
      prismaStudent.age,
      prismaStudent.birthDate,
      prismaStudent.certificationType as CertificationType,
      prismaStudent.graduationDate,
      prismaStudent.schoolId,
      prismaStudent.contactPhone || undefined,
      prismaStudent.isLeveled,
      prismaStudent.expectedLevel || undefined,
      prismaStudent.address || undefined,
      prismaStudent.parents?.map(p => ({ id: p.id, name: p.name })) || [],
      prismaStudent.createdAt,
      prismaStudent.updatedAt
    );
  }

  static toPrisma(student: Student): Omit<PrismaStudent, 'createdAt' | 'updatedAt'> {
    return {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      age: student.age,
      birthDate: student.birthDate,
      certificationType: student.certificationType,
      graduationDate: student.graduationDate,
      schoolId: student.schoolId,
      contactPhone: student.contactPhone || null,
      isLeveled: student.isLeveled,
      expectedLevel: student.expectedLevel || null,
      address: student.address || null,
    };
  }
}

