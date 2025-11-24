import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Module {
  id: string;
  key: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
}

export class GetAllModulesUseCase {
  async execute(): Promise<Module[]> {
    const modules = await prisma.module.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    return modules.map((module) => ({
      id: module.id,
      key: module.key,
      name: module.name,
      description: module.description,
      displayOrder: module.displayOrder,
      isActive: module.isActive,
    }));
  }
}

