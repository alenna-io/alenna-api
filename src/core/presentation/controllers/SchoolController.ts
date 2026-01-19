import { Request, Response } from 'express';
import { container } from '../../infrastructure/frameworks/di/container';
import { GetSchoolWithCurrentYearByUserIdUseCase } from '../../application/use-cases/schools';
import { InvalidEntityError } from '../../domain/errors';
import { validateUuid } from '../../domain/utils/validation';

export class SchoolController {
  constructor(
    private readonly getSchoolWithCurrentYearByUserIdUseCase: GetSchoolWithCurrentYearByUserIdUseCase = container.useCase.getSchoolWithCurrentYearByUserIdUseCase
  ) { }

  async getSchoolWithCurrentYearByUserId(req: Request, res: Response): Promise<Response> {
    const userId = req.userId;
    if (!userId) {
      throw new InvalidEntityError('User', 'User ID is required');
    }
    validateUuid(userId, 'User');
    const result = await this.getSchoolWithCurrentYearByUserIdUseCase.execute(userId);
    if (!result.success) {
      throw result.error;
    }
    return res.status(200).json(result.data);
  }
}