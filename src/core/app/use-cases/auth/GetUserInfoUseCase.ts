import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
}

export class GetUserInfoUseCase {
  async execute(userId: string): Promise<UserInfoOutput> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        school: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Collect all permissions from user's roles
    const permissions = new Set<string>();
    user.userRoles.forEach(userRole => {
      userRole.role.rolePermissions.forEach(rp => {
        permissions.add(rp.permission.name);
      });
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      schoolId: user.schoolId,
      schoolName: user.school.name,
      roles: user.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        displayName: ur.role.displayName,
      })),
      permissions: Array.from(permissions),
    };
  }
}

