import { PrismaClient } from '@prisma/client';
import {
  MODULE_KEY_TO_DB_KEY,
  PERMISSION_DEFINITIONS,
  ROLE_PERMISSION_MAP,
  type ModuleKey,
  type RoleName,
} from './permission-map';

const prisma = new PrismaClient();
const prismaAny = prisma as any;

export interface PermissionCheckInput {
  userId: string;
  permission: string;
  resourceOwnerId?: string;
}

interface UserContext {
  id: string;
  schoolId: string;
  roles: Array<{ id: string; name: string }>;
  linkedStudentIds: Set<string>;
  studentId?: string;
}

interface ModuleRecord {
  id: string;
  key: string;
  name: string;
  description: string | null;
  displayOrder: number;
}

interface AccessProfile {
  permissions: string[];
  moduleActions: Map<ModuleKey, string[]>;
  modules: Map<ModuleKey, ModuleRecord>;
}

export class CheckPermissionUseCase {
  private moduleCache = new Map<ModuleKey, ModuleRecord>();

  async execute(input: PermissionCheckInput): Promise<boolean> {
    const { userId, permission, resourceOwnerId } = input;


    const permissionDefinition = PERMISSION_DEFINITIONS[permission];
    if (!permissionDefinition) {
      return false;
    }

    const userContext = await this.getUserContext(userId);
    if (!userContext || userContext.roles.length === 0) {
      return false;
    }

    const isSuperAdmin = userContext.roles.some((role) => role.name === 'SUPERADMIN');
    if (isSuperAdmin) {
      const superPermissions = ROLE_PERMISSION_MAP.SUPERADMIN;
      const hasPermission = superPermissions.includes(permission);
      return hasPermission;
    }

    // For global scope permissions, only check if user has the permission in their role
    if (permissionDefinition.scope === 'global') {
      for (const role of userContext.roles) {
        const roleName = this.toRoleName(role.name);
        if (!roleName) {
          continue;
        }

        const allowedPermissions = ROLE_PERMISSION_MAP[roleName];
        if (allowedPermissions && allowedPermissions.includes(permission)) {
          return true;
        }
      }
      return false;
    }

    // For school and own scope permissions, check module activation and role assignments
    const moduleRecord = await this.getModule(permissionDefinition.module);
    if (!moduleRecord) {
      return false;
    }

    const activeModule = await prisma.schoolModule.findUnique({
      where: {
        schoolId_moduleId: {
          schoolId: userContext.schoolId,
          moduleId: moduleRecord.id,
        },
      },
    });

    if (!activeModule || !activeModule.isActive) {
      return false;
    }

    const roleAssignments = await prismaAny.roleModuleSchool.findMany({
      where: {
        schoolId: userContext.schoolId,
        moduleId: moduleRecord.id,
        roleId: {
          in: userContext.roles.map((role) => role.id),
        },
      },
    });

    if (roleAssignments.length === 0) {
      return false;
    }

    const assignedRoleIds = new Set(
      roleAssignments.map((assignment: { roleId: string }) => assignment.roleId),
    );

    for (const role of userContext.roles) {
      if (!assignedRoleIds.has(role.id)) {
        continue;
      }

      const roleName = this.toRoleName(role.name);
      if (!roleName) {
        continue;
      }

      const allowedPermissions = ROLE_PERMISSION_MAP[roleName];
      if (!allowedPermissions || !allowedPermissions.includes(permission)) {
        continue;
      }

      if (permissionDefinition.scope === 'own') {
        if (!resourceOwnerId) {
          return true;
        }

        if (roleName === 'PARENT' && userContext.linkedStudentIds.has(resourceOwnerId)) {
          return true;
        }

        if (roleName === 'STUDENT' && userContext.studentId === resourceOwnerId) {
          return true;
        }

        // If user also has another role that grants broader access, continue loop
        continue;
      }

      // For school scope permissions, we've already verified module activation and role assignments
      return true;
    }

    return false;
  }

  async enforcePermission(input: PermissionCheckInput): Promise<void> {
    const hasPermission = await this.execute(input);

    if (!hasPermission) {
      throw new Error(`No tienes permiso para: ${input.permission}`);
    }
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const userContext = await this.getUserContext(userId);
    if (!userContext || userContext.roles.length === 0) {
      return [];
    }

    const profile = await this.buildAccessProfile(userContext);
    return profile.permissions;
  }

  async getUserModules(userId: string): Promise<Array<{ id: string; key: string; name: string; description?: string; displayOrder: number; actions: string[] }>> {
    const userContext = await this.getUserContext(userId);
    if (!userContext || userContext.roles.length === 0) {
      return [];
    }

    const profile = await this.buildAccessProfile(userContext);

    return Array.from(profile.modules.entries())
      .map(([moduleKey, moduleRecord]) => ({
        id: moduleRecord.id,
        key: moduleRecord.key,
        name: moduleRecord.name,
        description: moduleRecord.description ?? undefined,
        displayOrder: moduleRecord.displayOrder,
        actions: profile.moduleActions.get(moduleKey) ?? [],
      }))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  private async buildAccessProfile(userContext: UserContext): Promise<AccessProfile> {
    const applicableRoles = userContext.roles
      .map((role) => this.toRoleName(role.name))
      .filter((roleName): roleName is RoleName => Boolean(roleName));

    if (applicableRoles.length === 0) {
      return {
        permissions: [],
        moduleActions: new Map(),
        modules: new Map(),
      };
    }

    const isSuperAdmin = applicableRoles.includes('SUPERADMIN');
    const roleIds = userContext.roles.map((role) => role.id);

    const moduleKeys = new Set<ModuleKey>();
    if (isSuperAdmin) {
      // SUPERADMIN can only see: users, schools, and configuration modules
      moduleKeys.add('users');
      moduleKeys.add('schools');
      moduleKeys.add('configuration');
    } else {
      for (const roleName of applicableRoles) {
        const permissions = ROLE_PERMISSION_MAP[roleName];
        permissions.forEach((permission) => {
          const definition = PERMISSION_DEFINITIONS[permission];
          if (definition) {
            moduleKeys.add(definition.module);
          }
        });
      }
    }

    const modules = (await prismaAny.module.findMany({
      where: isSuperAdmin
        ? undefined
        : {
            key: {
              in: Array.from(moduleKeys).map((moduleKey) => MODULE_KEY_TO_DB_KEY[moduleKey]),
            },
          },
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        displayOrder: true,
      },
    })) as ModuleRecord[];

    const moduleByKey = new Map<string, ModuleRecord>();
    modules.forEach((module: ModuleRecord) => moduleByKey.set(module.key, module));

    const moduleIds = modules.map((module) => module.id);

    const activeModuleIds = isSuperAdmin
      ? new Set(moduleIds)
      : new Set(
          (
            await prisma.schoolModule.findMany({
              where: {
                schoolId: userContext.schoolId,
                moduleId: {
                  in: moduleIds,
                },
                isActive: true,
              },
              select: {
                moduleId: true,
              },
            })
          ).map((sm) => sm.moduleId)
        );

    const assignmentsByRole = new Map<string, Set<string>>();
    if (isSuperAdmin) {
      userContext.roles.forEach((role) => {
        assignmentsByRole.set(role.id, new Set(moduleIds));
      });
    } else {
      const roleAssignments = await prismaAny.roleModuleSchool.findMany({
        where: {
          schoolId: userContext.schoolId,
          moduleId: { in: moduleIds },
          roleId: { in: roleIds },
        },
        select: {
          roleId: true,
          moduleId: true,
        },
      });

      roleAssignments.forEach((assignment: { roleId: string; moduleId: string }) => {
        const existing = assignmentsByRole.get(assignment.roleId) ?? new Set<string>();
        existing.add(assignment.moduleId);
        assignmentsByRole.set(assignment.roleId, existing);
      });
    }

    const permissionSet = new Set<string>();
    const moduleActions = new Map<ModuleKey, string[]>();

    for (const role of userContext.roles) {
      const roleName = this.toRoleName(role.name);
      if (!roleName) {
        continue;
      }

      const allowedPermissions = ROLE_PERMISSION_MAP[roleName];
      if (!allowedPermissions) {
        continue;
      }

      const assignedModules = assignmentsByRole.get(role.id);
      if (!assignedModules) {
        if (roleName !== 'SUPERADMIN') {
          continue;
        }
      }
      
      // Ensure assignedModules is defined for non-SUPERADMIN roles
      if (roleName !== 'SUPERADMIN' && !assignedModules) {
        continue;
      }

      for (const permission of allowedPermissions) {
        const definition = PERMISSION_DEFINITIONS[permission];
        if (!definition) {
          continue;
        }

        const moduleRecord = moduleByKey.get(MODULE_KEY_TO_DB_KEY[definition.module]);
        if (!moduleRecord) {
          continue;
        }

        if (!isSuperAdmin) {
          if (!activeModuleIds.has(moduleRecord.id)) {
            continue;
          }

          if (!assignedModules || !assignedModules.has(moduleRecord.id)) {
            continue;
          }
        }

        permissionSet.add(permission);

        const existingActions = moduleActions.get(definition.module) ?? [];
        if (!existingActions.includes(permission)) {
          existingActions.push(permission);
          moduleActions.set(definition.module, existingActions);
        }

        if (!this.moduleCache.has(definition.module)) {
          this.moduleCache.set(definition.module, moduleRecord);
        }
      }
    }

    const resultModules = new Map<ModuleKey, ModuleRecord>();
    moduleActions.forEach((actions, moduleKey) => {
      actions.sort();
      const record = this.moduleCache.get(moduleKey);
      if (record) {
        resultModules.set(moduleKey, record);
      }
    });

    return {
      permissions: Array.from(permissionSet).sort(),
      moduleActions,
      modules: resultModules,
    };
  }

  private async getUserContext(userId: string): Promise<UserContext | null> {
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
        userStudents: {
          select: {
            studentId: true,
          },
        },
        student: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const context = {
      id: user.id,
      schoolId: user.schoolId,
      roles: user.userRoles.map((userRole) => ({
        id: userRole.role.id,
        name: userRole.role.name,
      })),
      linkedStudentIds: new Set(user.userStudents.map((student) => student.studentId)),
      studentId: user.student?.id,
    };

    return context;
  }

  private async getModule(moduleKey: ModuleKey): Promise<ModuleRecord | null> {
    const cachedModule = this.moduleCache.get(moduleKey);
    if (cachedModule) {
      return cachedModule;
    }

    const dbKey = MODULE_KEY_TO_DB_KEY[moduleKey];

    const module = (await prismaAny.module.findUnique({
      where: { key: dbKey },
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        displayOrder: true,
      },
    })) as ModuleRecord | null;

    if (!module) {
      return null;
    }

    this.moduleCache.set(moduleKey, module);
    return module;
  }

  private toRoleName(roleName: string): RoleName | null {
    if (['SUPERADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'].includes(roleName)) {
      return roleName as RoleName;
    }

    return null;
  }
}

