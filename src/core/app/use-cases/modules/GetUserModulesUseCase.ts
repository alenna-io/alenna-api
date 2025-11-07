import { CheckPermissionUseCase } from '../auth/CheckPermissionUseCase';

export interface ModuleOutput {
  id: string;
  key: string;
  name: string;
  description?: string;
  displayOrder: number;
  actions: string[];
}

export class GetUserModulesUseCase {
  async execute(userId: string): Promise<ModuleOutput[]> {
    const accessControl = new CheckPermissionUseCase();
    const modules = await accessControl.getUserModules(userId);

    return modules.map((module) => ({
      id: module.id,
      key: module.key,
      name: module.name,
      description: module.description,
      displayOrder: module.displayOrder,
      actions: module.actions,
    }));
  }
}

