import { Request, Response } from 'express';
import { container } from '../../di/container';

export class SubSubjectController {
  async getSubSubjects(req: Request, res: Response): Promise<void> {
    try {
      const subSubjects = await container.getSubSubjectsUseCase.execute();
      res.json(subSubjects);
    } catch (error: any) {
      console.error('Error getting subSubjects:', error);
      res.status(500).json({ error: error.message || 'Failed to get subSubjects' });
    }
  }
}

