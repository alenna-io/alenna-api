import { Request, Response } from 'express';
import { container } from '../../infrastructure/frameworks/di/container';
import { GetSchoolWithCurrentYearByUserIdUseCase, GetCurrentWeekUseCase } from '../../application/use-cases/schools';
import { InvalidEntityError } from '../../domain/errors';

export class SchoolController {
  constructor(
    private readonly getSchoolWithCurrentYearByUserIdUseCase: GetSchoolWithCurrentYearByUserIdUseCase = container.useCase.getSchoolWithCurrentYearByUserIdUseCase,
    private readonly getCurrentWeekUseCase: GetCurrentWeekUseCase = container.useCase.getCurrentWeekUseCase
  ) { }

  async getSchoolWithCurrentYearByUserId(req: Request, res: Response): Promise<Response> {
    const userId = req.userId;
    if (!userId) {
      throw new InvalidEntityError('User', 'User ID is required');
    }
    const result = await this.getSchoolWithCurrentYearByUserIdUseCase.execute(userId);
    if (!result.success) {
      throw result.error;
    }
    return res.status(200).json(result.data);
  }

  async getCurrentWeek(req: Request, res: Response): Promise<Response> {
    const userId = req.userId;
    if (!userId) {
      throw new InvalidEntityError('User', 'User ID is required');
    }
    const result = await this.getCurrentWeekUseCase.execute(userId);
    if (!result.success) {
      throw result.error;
    }
    if (result.data === null) {
      return res.status(404).json({ error: 'No active school year found' });
    }
    return res.status(200).json(result.data);
  }
}