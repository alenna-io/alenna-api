import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ModuleOutput {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  permissions: string[]; // User's permissions within this module
}

export class GetUserModulesUseCase {
  /**
   * Get all modules accessible to a user with their permissions
   */
  async execute(userId: string): Promise<ModuleOutput[]> {
    // 1. Get user with roles and module access
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        schoolId: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: {
                      include: {
                        module: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        userModules: {
          include: {
            module: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // 2. Get modules enabled for school
    const schoolModules = await prisma.schoolModule.findMany({
      where: {
        schoolId: user.schoolId,
        isActive: true,
      },
      include: {
        module: true,
      },
    });

    const enabledModuleIds = new Set(schoolModules.map(sm => sm.moduleId));

    // 3. Filter user modules to only those enabled for school
    const userModuleIds = new Set(
      user.userModules
        .filter(um => enabledModuleIds.has(um.moduleId))
        .map(um => um.moduleId)
    );

    // 4. Get all permissions for user's roles
    const allPermissions: Array<{ permission: string; moduleId: string }> = [];
    
    for (const userRole of user.userRoles) {
      for (const rolePermission of userRole.role.rolePermissions) {
        allPermissions.push({
          permission: rolePermission.permission.name,
          moduleId: rolePermission.permission.moduleId,
        });
      }
    }

    // 5. Build module output with permissions
    const modules = user.userModules
      .filter(um => enabledModuleIds.has(um.moduleId))
      .map(um => {
        // Get permissions for this module
        const modulePermissions = allPermissions
          .filter(p => p.moduleId === um.moduleId)
          .map(p => p.permission);

        return {
          id: um.module.id,
          name: um.module.name,
          description: um.module.description || undefined,
          displayOrder: um.module.displayOrder,
          permissions: Array.from(new Set(modulePermissions)), // Remove duplicates
        };
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);

    return modules;
  }
}

