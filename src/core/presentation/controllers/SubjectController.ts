import { Request, Response } from 'express';
import { container } from '../../infrastructure/frameworks/di/container';
import { GetSubjectAndNextLevelsWithPacesUseCase } from '../../application/use-cases/subjects';
import { InvalidEntityError } from '../../domain/errors';
import { validateUuid } from '../../domain/utils/validation';

export class SubjectController {
  constructor(
    private readonly getSubjectAndNextLevelsWithPacesUseCase: GetSubjectAndNextLevelsWithPacesUseCase = container.useCase.getSubjectAndNextLevelsWithPacesUseCase
  ) { }

  async getSubjectAndNextLevelsWithPaces(req: Request, res: Response): Promise<Response> {
    const subjectId = req.params.subjectId;
    if (!subjectId) {
      throw new InvalidEntityError('Subject', 'Subject ID is required');
    }
    validateUuid(subjectId, 'Subject');
    const result = await this.getSubjectAndNextLevelsWithPacesUseCase.execute(subjectId);
    if (!result.success) {
      throw result.error;
    }
    return res.status(200).json(result.data);
  }
}