import { 
  Student as PrismaStudent, 
  User as PrismaUser,
  UserStudent as PrismaUserStudent,
  CertificationType as PrismaCertificationType 
} from '@prisma/client';
import { Student, CertificationType } from '../../../domain/entities';

type PrismaStudentWithRelations = PrismaStudent & {
  user?: PrismaUser;
  userStudents?: (PrismaUserStudent & { user: PrismaUser })[];
  certificationType?: PrismaCertificationType;
};

export class StudentMapper {
  static toDomain(prismaStudent: PrismaStudentWithRelations): Student {
    if (!prismaStudent.certificationType) {
      throw new Error('CertificationType must be included when mapping student');
    }

    if (!prismaStudent.user) {
      throw new Error('User must be included when mapping student');
    }

    const certificationType: CertificationType = {
      id: prismaStudent.certificationType.id,
      name: prismaStudent.certificationType.name,
      description: prismaStudent.certificationType.description || undefined,
      isActive: prismaStudent.certificationType.isActive,
    };

    // Calculate age from birthDate
    const today = new Date();
    const birthDate = new Date(prismaStudent.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Get parent users
    const parents = prismaStudent.userStudents?.map(us => ({
      id: us.user.id,
      name: `${us.user.firstName || ''} ${us.user.lastName || ''}`.trim(),
    })) || [];

    return new Student(
      prismaStudent.id,
      prismaStudent.user.firstName || '',
      prismaStudent.user.lastName || '',
      age,
      prismaStudent.birthDate,
      prismaStudent.certificationTypeId,
      certificationType,
      prismaStudent.graduationDate,
      prismaStudent.schoolId,
      prismaStudent.contactPhone || undefined,
      prismaStudent.isLeveled,
      prismaStudent.expectedLevel || undefined,
      prismaStudent.currentLevel || undefined,
      prismaStudent.address || undefined,
      parents,
      prismaStudent.createdAt,
      prismaStudent.updatedAt
    );
  }

  static toPrisma(student: Student): Omit<PrismaStudent, 'createdAt' | 'updatedAt' | 'deletedAt'> {
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
      currentLevel: student.currentLevel || null,
      address: student.address || null,
      deletedAt: null,
    };
  }
}

