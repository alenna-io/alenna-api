import { Request, Response } from 'express';
import { GetSubSubjectsUseCase, CreateSubSubjectWithPacesUseCase } from '../../../app/use-cases';
import { CreateSubSubjectDTO } from '../../../app/dtos/SubSubjectDTO';

export class SubSubjectController {
  constructor(
    private getSubSubjectsUseCase: GetSubSubjectsUseCase,
    private createSubSubjectWithPacesUseCase: CreateSubSubjectWithPacesUseCase
  ) { }

  getSubSubjects = async (_req: Request, res: Response): Promise<void> => {
    try {
      const subSubjects = await this.getSubSubjectsUseCase.execute();
      res.json(subSubjects);
    } catch (error: any) {
      console.error('Error getting subSubjects:', error);
      res.status(500).json({ error: error.message || 'Failed to get subSubjects' });
    }
  }

  createSubSubject = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = CreateSubSubjectDTO.parse(req.body);
      const subSubject = await this.createSubSubjectWithPacesUseCase.execute(validatedData);
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
