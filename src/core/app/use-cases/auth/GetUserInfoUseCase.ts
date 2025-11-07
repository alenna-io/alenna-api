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

export interface UserInfoOutput {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  schoolId: string;
  schoolName: string;
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
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const accessControl = new CheckPermissionUseCase();
    const [permissions, modules] = await Promise.all([
      accessControl.getUserPermissions(userId),
      accessControl.getUserModules(userId),
    ]);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      schoolId: user.schoolId,
      schoolName: user.school.name,
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

