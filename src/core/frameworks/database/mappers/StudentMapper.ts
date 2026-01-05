import {
  Student as PrismaStudent,
  User as PrismaUser,
  UserStudent as PrismaUserStudent,
  CertificationType as PrismaCertificationType,
  UserRole as PrismaUserRole,
  Role as PrismaRole
} from '@prisma/client';
import { Student, CertificationType, User } from '../../../domain/entities';
import { RoleType } from '../../../domain/roles/RoleTypes';

type PrismaUserWithRoles = PrismaUser & {
  userRoles?: (PrismaUserRole & {
    role: PrismaRole;
  })[];
};

type PrismaStudentWithRelations = PrismaStudent & {
  user?: PrismaUserWithRoles;
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

    const roles = prismaStudent.user.userRoles?.map(ur => ({
      id: ur.role.id,
      name: ur.role.name as RoleType,
      displayName: ur.role.displayName,
    })) || [];

    const user = new User(
      prismaStudent.user.id,
      prismaStudent.user.clerkId,
      prismaStudent.user.email,
      prismaStudent.user.schoolId,
      prismaStudent.user.firstName || undefined,
      prismaStudent.user.lastName || undefined,
      prismaStudent.user.phone || undefined,
      prismaStudent.user.language || undefined,
      prismaStudent.user.isActive,
      prismaStudent.user.createdPassword,
      roles,
    );

    const certificationType = new CertificationType(
      prismaStudent.certificationType.id,
      prismaStudent.certificationType.name,
      prismaStudent.certificationType.schoolId,
      prismaStudent.certificationType.description || undefined,
      prismaStudent.certificationType.isActive,
      prismaStudent.certificationType.createdAt,
      prismaStudent.certificationType.updatedAt
    );

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
      email: us.user.email || undefined,
      firstName: us.user.firstName || undefined,
      lastName: us.user.lastName || undefined,
      phone: us.user.phone || undefined,
      relationship: us.relationship || undefined,
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
      prismaStudent.user.isActive,
      prismaStudent.isLeveled,
      prismaStudent.expectedLevel || undefined,
      prismaStudent.currentLevel || undefined,
      parents,
      prismaStudent.createdAt,
      prismaStudent.updatedAt,
      user
    );
  }

  static toPrisma(student: Student): Omit<PrismaStudent, 'createdAt' | 'updatedAt' | 'deletedAt'> {
    return {
      id: student.id,
      userId: student.id, // Assuming student.id is the userId
      birthDate: student.birthDate,
      certificationTypeId: student.certificationTypeId,
      graduationDate: student.graduationDate,
      schoolId: student.schoolId,
      isLeveled: student.isLeveled,
      expectedLevel: student.expectedLevel || null,
      currentLevel: student.currentLevel || null,
    };
  }
}

