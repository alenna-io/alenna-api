import { Request, Response } from 'express';
import { container } from '../../infrastructure/frameworks/di/container';
import {
  GetEnrolledWithoutOpenProjectionUseCase
} from '../../application/use-cases/students';
import { InvalidEntityError } from '../../domain/errors';
import { validateUuid } from '../../domain/utils/validation';

export class StudentController {
  constructor(
    private readonly getEnrolledWithoutOpenProjectionUseCase: GetEnrolledWithoutOpenProjectionUseCase = container.useCase.getEnrolledWithoutOpenProjectionUseCase
  ) { }

  async getEnrolledWithoutOpenProjection(req: Request, res: Response): Promise<Response> {
    const userId = req.userId;
    if (!userId) {
      throw new InvalidEntityError('User', 'User ID is required');
    }
    validateUuid(userId, 'User');
    const result = await this.getEnrolledWithoutOpenProjectionUseCase.execute(userId);
    if (!result.success) {
      throw result.error;
    }
    return res.status(200).json(result.data);
  }
}