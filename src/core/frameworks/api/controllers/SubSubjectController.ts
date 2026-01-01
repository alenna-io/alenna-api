import { Request, Response } from 'express';
import { container } from '../../di/container';
import { CreateSubSubjectDTO } from '../../../app/dtos/SubSubjectDTO';

export class SubSubjectController {
  async getSubSubjects(_req: Request, res: Response): Promise<void> {
    try {
      const subSubjects = await container.getSubSubjectsUseCase.execute();
      res.json(subSubjects);
    } catch (error: any) {
      console.error('Error getting subSubjects:', error);
      res.status(500).json({ error: error.message || 'Failed to get subSubjects' });
    }
  }

  async createSubSubject(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = CreateSubSubjectDTO.parse(req.body);
      const subSubject = await container.createSubSubjectWithPacesUseCase.execute(validatedData);
      res.status(201).json(subSubject);
    } catch (error: any) {
      console.error('Error creating subSubject:', error);

      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Validation error', issues: error.errors });
        return;
      }

      res.status(500).json({ error: error.message || 'Failed to create subSubject' });
    }
  }
}

