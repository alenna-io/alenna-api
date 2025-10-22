import { Request, Response } from 'express';
import { GetUserModulesUseCase } from '../../../app/use-cases/modules';

export class ModuleController {
  /**
   * GET /api/v1/modules/me
   * Get all modules accessible to current user with their permissions
   */
  async getUserModules(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const getUserModulesUseCase = new GetUserModulesUseCase();
      const modules = await getUserModulesUseCase.execute(userId);

      res.status(200).json(modules);
    } catch (error) {
      console.error('Error getting user modules:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Error al obtener módulos',
      });
    }
  }
}

