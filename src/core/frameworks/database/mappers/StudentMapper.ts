import { Student as PrismaStudent, Parent as PrismaParent, CertificationType as PrismaCertificationType } from '@prisma/client';
import { Student, CertificationType } from '../../../domain/entities';

type PrismaStudentWithRelations = PrismaStudent & {
  parents?: PrismaParent[];
  certificationType?: PrismaCertificationType;
};

export class StudentMapper {
  static toDomain(prismaStudent: PrismaStudentWithRelations): Student {
    if (!prismaStudent.certificationType) {
      throw new Error('CertificationType must be included when mapping student');
    }

    const certificationType: CertificationType = {
      id: prismaStudent.certificationType.id,
      name: prismaStudent.certificationType.name,
      description: prismaStudent.certificationType.description || undefined,
      isActive: prismaStudent.certificationType.isActive,
    };

    return new Student(
      prismaStudent.id,
      prismaStudent.firstName,
      prismaStudent.lastName,
      prismaStudent.age,
      prismaStudent.birthDate,
      prismaStudent.certificationTypeId,
      certificationType,
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
      certificationTypeId: student.certificationTypeId,
      graduationDate: student.graduationDate,
      schoolId: student.schoolId,
      contactPhone: student.contactPhone || null,
      isLeveled: student.isLeveled,
      expectedLevel: student.expectedLevel || null,
      address: student.address || null,
    };
  }
}

