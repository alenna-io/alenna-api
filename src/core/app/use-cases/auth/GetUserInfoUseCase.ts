import { PrismaClient } from '@prisma/client';
import { CheckPermissionUseCase } from './CheckPermissionUseCase';

const prisma = new PrismaClient();

export interface ModuleAccessOutput {
  key: string;
  name: string;
  description?: string;
  displayOrder: number;
  actions: string[];
}

export interface StudentProfileOutput {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  birthDate: string;
  graduationDate: string;
  certificationType?: string;
  phone?: string;
  isLeveled: boolean;
  expectedLevel?: string;
  currentLevel?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  parents: Array<{ id: string; name: string }>;
}

export interface UserInfoOutput {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  language?: string;
  schoolId: string;
  schoolName: string;
  studentId?: string;
  studentProfile?: StudentProfileOutput;
  createdPassword: boolean;
  roles: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
  permissions: string[];
  modules: ModuleAccessOutput[];
}

export class GetUserInfoUseCase {
  async execute(userId: string): Promise<UserInfoOutput> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        school: true,
        userRoles: {
          include: {
            role: true,
          },
        },
        student: {
          include: {
            certificationType: true,
            userStudents: {
              include: {
                user: {
                  include: {
                    userRoles: {
                      include: {
                        role: true,
                      },
                    },
                  },
                },
              },
            },
            user: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    let studentData = user.student;

    if (!studentData && user.userRoles.some((userRole) => userRole.role.name === 'STUDENT')) {
      studentData = await prisma.student.findFirst({
        where: {
          userId: user.id,
          deletedAt: null,
        },
        include: {
          certificationType: true,
          userStudents: {
            include: {
              user: {
                include: {
                  userRoles: {
                    include: {
                      role: true,
                    },
                  },
                },
              },
            },
          },
          user: true,
        },
      });

      if (studentData) {
        console.info('[GetUserInfo] Student profile resolved via fallback for user', userId, {
          studentId: studentData.id,
          parentLinks: studentData.userStudents.length,
        });
      }
    }

    if (!studentData) {
      console.info('[GetUserInfo] No student profile linked for user', userId);
    } else {
      console.info('[GetUserInfo] Student profile found for user', userId, {
        studentId: studentData.id,
        hasCertification: Boolean(studentData.certificationType),
        parentLinks: studentData.userStudents.length,
      });
    }

    const accessControl = new CheckPermissionUseCase();
    const [permissions, modules] = await Promise.all([
      accessControl.getUserPermissions(userId),
      accessControl.getUserModules(userId),
    ]);

    // Handle case where school might be soft-deleted or missing
    const schoolName = user.school?.name || 'Alenna'
    const schoolId = user.schoolId

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      language: user.language || undefined,
      schoolId: schoolId,
      schoolName: schoolName,
      studentId: user.student?.id ?? studentData?.id,
      createdPassword: user.createdPassword ?? false,
      studentProfile: studentData
        ? {
            id: studentData.id,
            firstName: studentData.user?.firstName ?? '',
            lastName: studentData.user?.lastName ?? '',
            name: `${studentData.user?.firstName ?? ''} ${studentData.user?.lastName ?? ''}`.trim(),
            birthDate: studentData.birthDate.toISOString(),
            graduationDate: studentData.graduationDate?.toISOString() ?? '',
            certificationType: studentData.certificationType?.name,
            phone: studentData.user?.phone ?? undefined,
            isLeveled: studentData.isLeveled,
            expectedLevel: studentData.expectedLevel ?? undefined,
            currentLevel: studentData.currentLevel ?? undefined,
            streetAddress: studentData.user?.streetAddress ?? undefined,
            city: studentData.user?.city ?? undefined,
            state: studentData.user?.state ?? undefined,
            country: studentData.user?.country ?? undefined,
            zipCode: studentData.user?.zipCode ?? undefined,
            parents: studentData.userStudents
              .filter((userStudent) => userStudent.user.userRoles.some((role) => role.role.name === 'PARENT'))
              .map((userStudent) => ({
                id: userStudent.user.id,
                name: `${userStudent.user.firstName ?? ''} ${userStudent.user.lastName ?? ''}`.trim(),
              })),
          }
        : undefined,
      roles: user.userRoles.map((userRole) => ({
        id: userRole.role.id,
        name: userRole.role.name,
        displayName: userRole.role.displayName,
      })),
      permissions: permissions.sort(),
      modules,
    };
  }
}

