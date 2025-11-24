import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SchoolModule {
  id: string;
  key: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isEnabled: boolean;
}

export class GetSchoolModulesUseCase {
  async execute(schoolId: string): Promise<SchoolModule[]> {
    // Get all available modules
    const allModules = await prisma.module.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    // Get enabled modules for this school
    const schoolModules = await prisma.schoolModule.findMany({
      where: {
        schoolId,
        isActive: true,
      },
      include: {
        module: true,
      },
    });

    const enabledModuleIds = new Set(schoolModules.map(sm => sm.moduleId));

    return allModules.map((module) => ({
      id: module.id,
      key: module.key,
      name: module.name,
      description: module.description,
      displayOrder: module.displayOrder,
      isEnabled: enabledModuleIds.has(module.id),
    }));
  }
}

