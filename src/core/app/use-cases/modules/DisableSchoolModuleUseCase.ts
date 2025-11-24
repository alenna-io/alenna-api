import { PrismaClient } from '@prisma/client';
import { MODULE_DEPENDENCIES, type ModuleKey } from '../auth/permission-map';

const prisma = new PrismaClient();

export class DisableSchoolModuleUseCase {
  async execute(schoolId: string, moduleId: string): Promise<void> {
    // Get the module to check dependencies
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      throw new Error('Module not found');
    }

    const moduleKey = module.key as ModuleKey;

    // Check if any child modules depend on this module
    // If disabling a parent module, all child modules must be disabled first
    const allModules = await prisma.module.findMany();
    
    for (const childModule of allModules) {
      const childModuleKey = childModule.key as ModuleKey;
      const childDependencies = MODULE_DEPENDENCIES[childModuleKey] || [];
      
      // Check if this module is a dependency of any child module
      if (childDependencies.includes(moduleKey)) {
        // Check if child module is currently enabled
        const childEnabled = await prisma.schoolModule.findUnique({
          where: {
            schoolId_moduleId: {
              schoolId,
              moduleId: childModule.id,
            },
          },
        });

        if (childEnabled && childEnabled.isActive) {
          throw new Error(
            `Cannot disable module '${moduleKey}' because child module '${childModuleKey}' is still enabled. Please disable '${childModuleKey}' first.`
          );
        }
      }
    }

    // Disable module for school (soft delete by setting isActive to false)
    await prisma.schoolModule.updateMany({
      where: {
        schoolId,
        moduleId,
      },
      data: {
        isActive: false,
      },
    });

    // Note: We don't delete role-module assignments as they will be automatically
    // filtered out by permission checks when the module is disabled
  }
}

