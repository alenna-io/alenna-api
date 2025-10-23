import { Request, Response } from 'express';
import { container } from '../../di/container';

export class PaceCatalogController {
  async getPaceCatalog(req: Request, res: Response): Promise<void> {
    try {
      const { category, level, subSubjectId } = req.query;

      const filters = {
        ...(category && { categoryName: category as string }),
        ...(level && { levelId: level as string }),
        ...(subSubjectId && { subSubjectId: subSubjectId as string }),
      };

      const paces = await container.getPaceCatalogUseCase.execute(filters);

      res.json(paces);
    } catch (error: any) {
      console.error('Error getting PACE catalog:', error);
      res.status(500).json({ error: error.message || 'Failed to get PACE catalog' });
    }
  }
}

