import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { MODULE_DEPENDENCIES, type ModuleKey } from '../auth/permission-map';

const prisma = new PrismaClient();

export class EnableSchoolModuleUseCase {
  async execute(schoolId: string, moduleId: string): Promise<void> {
    // Get the module to ensure it exists
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      throw new Error('Module not found');
    }

    const moduleKey = module.key as ModuleKey;

    // Check module dependencies - parent modules must be enabled first
    const dependencies = MODULE_DEPENDENCIES[moduleKey] || [];
    if (dependencies.length > 0) {
      for (const dependencyKey of dependencies) {
        const dependencyModule = await prisma.module.findUnique({
          where: { key: dependencyKey },
        });

        if (!dependencyModule) {
          throw new Error(`Dependency module '${dependencyKey}' not found`);
        }

        // Check if dependency is enabled for this school
        const dependencyEnabled = await prisma.schoolModule.findUnique({
          where: {
            schoolId_moduleId: {
              schoolId,
              moduleId: dependencyModule.id,
            },
          },
        });

        if (!dependencyEnabled || !dependencyEnabled.isActive) {
          throw new Error(
            `Module '${moduleKey}' requires module '${dependencyKey}' to be enabled first`
          );
        }
      }
    }

    // Enable module for school
    await prisma.schoolModule.upsert({
      where: {
        schoolId_moduleId: {
          schoolId,
          moduleId,
        },
      },
      update: {
        isActive: true,
      },
      create: {
        id: randomUUID(),
        schoolId,
        moduleId,
        isActive: true,
      },
    });

    // Define which roles should get access to which modules
    let rolesToGrant: string[] = [];
    
    switch (moduleKey) {
      case 'students':
        rolesToGrant = ['SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'];
        break;
      case 'projections':
        rolesToGrant = ['SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'];
        break;
      case 'paces':
        rolesToGrant = ['SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'];
        break;
      case 'monthlyAssignments':
        rolesToGrant = ['SCHOOL_ADMIN', 'TEACHER'];
        break;
      case 'reportCards':
        rolesToGrant = ['SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'];
        break;
      case 'groups':
        rolesToGrant = ['SCHOOL_ADMIN', 'TEACHER'];
        break;
      case 'teachers':
        rolesToGrant = ['SCHOOL_ADMIN'];
        break;
      case 'school_admin':
        rolesToGrant = ['SCHOOL_ADMIN', 'TEACHER'];
        break;
      case 'schools':
        rolesToGrant = ['SUPERADMIN'];
        break;
      case 'users':
        rolesToGrant = ['SUPERADMIN'];
        break;
      case 'billing':
        rolesToGrant = ['SCHOOL_ADMIN'];
        break;
      default:
        // For unknown modules, grant to SCHOOL_ADMIN by default
        rolesToGrant = ['SCHOOL_ADMIN'];
    }

    // Grant module access to appropriate roles
    for (const roleName of rolesToGrant) {
      const role = await prisma.role.findFirst({
        where: {
          name: roleName,
          schoolId: null, // System roles only
        },
      });

      if (role) {
        await prisma.roleModuleSchool.upsert({
          where: {
            roleId_schoolId_moduleId: {
              roleId: role.id,
              schoolId,
              moduleId,
            },
          },
          update: {},
          create: {
            id: randomUUID(),
            roleId: role.id,
            schoolId,
            moduleId,
          },
        });
      }
    }
  }
}

