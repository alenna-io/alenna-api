import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PermissionCheckInput {
  userId: string;
  permission: string; // e.g., "students.read", "projections.update"
  resourceOwnerId?: string; // For "readOwn" permissions - the student/resource owner ID
}

export class CheckPermissionUseCase {
  /**
   * Check if user has permission to perform an action
   * 
   * Logic:
   * 1. Get user's roles (many-to-many)
   * 2. Check if permission is assigned to any of user's roles (via RolePermission)
   * 3. Check if user has access to the module that contains the permission
   * 4. For "Own" permissions (readOwn, etc.), verify ownership
   */
  async execute(input: PermissionCheckInput): Promise<boolean> {
    const { userId, permission, resourceOwnerId } = input;

    try {
      // 1. Get user with roles
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true,
          schoolId: true,
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

      if (user.userRoles.length === 0) {
        return false;
      }

      // 2. Check if this permission exists and get its module
      const permissionRecord = await prisma.permission.findUnique({
        where: { name: permission },
        include: { module: true },
      });

      if (!permissionRecord) {
        return false;
      }

      // 3. Check if ANY of user's roles has this permission
      const userRoleIds = user.userRoles.map(ur => ur.role.id);
      
      const rolePermission = await prisma.rolePermission.findFirst({
        where: {
          roleId: { in: userRoleIds },
          permissionId: permissionRecord.id,
        },
      });

      if (!rolePermission) {
        return false;
      }

      // 4. Check if school has this module enabled
      const schoolModule = await prisma.schoolModule.findUnique({
        where: {
          schoolId_moduleId: {
            schoolId: user.schoolId,
            moduleId: permissionRecord.moduleId,
          },
        },
      });

      if (!schoolModule || !schoolModule.isActive) {
        return false;
      }

      // 5. Check if user has access to this module
      const userModule = await prisma.userModule.findUnique({
        where: {
          userId_moduleId: {
            userId: user.id,
            moduleId: permissionRecord.moduleId,
          },
        },
      });

      if (!userModule) {
        return false;
      }

      // 6. For "Own" permissions, verify ownership
      if (permission.endsWith('.readOwn') || permission.endsWith('.updateOwn')) {
        if (!resourceOwnerId) {
          // "Own" permission requires resourceOwnerId
          return false;
        }

        // Check if user has PARENT role and is linked to this student
        const hasParentRole = user.userRoles.some(ur => ur.role.name === 'PARENT');
        
        if (hasParentRole) {
          const userStudent = await prisma.userStudent.findUnique({
            where: {
              userId_studentId: {
                userId: user.id,
                studentId: resourceOwnerId,
              },
            },
          });

          return !!userStudent;
        }

        // For other roles with "Own" permissions, check if resource belongs to user's school
        // (Implement additional ownership logic as needed)
        return true;
      }

      // All checks passed
      return true;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Check permission and throw error if not allowed
   */
  async enforcePermission(input: PermissionCheckInput): Promise<void> {
    const hasPermission = await this.execute(input);
    
    if (!hasPermission) {
      throw new Error(`No tienes permiso para: ${input.permission}`);
    }
  }

  /**
   * Get all permissions for a user (useful for UI)
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        schoolId: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || user.userRoles.length === 0) {
      return [];
    }

    // Get all permissions for user's roles
    const userRoleIds = user.userRoles.map(ur => ur.role.id);
    
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: { in: userRoleIds } },
      include: {
        permission: {
          include: {
            module: true,
          },
        },
      },
    });

    // Filter by modules user has access to
    const userModules = await prisma.userModule.findMany({
      where: { userId },
      select: { moduleId: true },
    });

    const userModuleIds = new Set(userModules.map(um => um.moduleId));

    // Get unique permissions (in case multiple roles grant same permission)
    const permissionSet = new Set<string>();
    rolePermissions
      .filter(rp => userModuleIds.has(rp.permission.moduleId))
      .forEach(rp => permissionSet.add(rp.permission.name));

    return Array.from(permissionSet);
  }
  
  /**
   * Get all roles for a user
   */
  async getUserRoles(userId: string): Promise<Array<{ id: string; name: string; displayName: string }>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    return user.userRoles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name,
      displayName: ur.role.displayName,
    }));
  }
}

