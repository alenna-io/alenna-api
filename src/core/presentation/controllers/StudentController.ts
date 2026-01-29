import { Request, Response } from 'express';
import { container } from '../../infrastructure/frameworks/di/container';
import {
  GetEnrolledWithoutOpenProjectionUseCase
} from '../../application/use-cases/students';
import { InvalidEntityError } from '../../domain/errors';
import { validateUuid } from '../../domain/utils/validation';
import { logger } from '../../../utils/logger';

export class StudentController {
  constructor(
    private readonly getEnrolledWithoutOpenProjectionUseCase: GetEnrolledWithoutOpenProjectionUseCase = container.useCase.getEnrolledWithoutOpenProjectionUseCase
  ) { }

  async getEnrolledWithoutOpenProjection(req: Request, res: Response): Promise<Response> {
    const userId = req.userId;
    logger.info('[StudentController.getEnrolledWithoutOpenProjection] req.userId:', userId);
    logger.info('[StudentController.getEnrolledWithoutOpenProjection] req.userId type:', typeof userId);
    logger.info('[StudentController.getEnrolledWithoutOpenProjection] req.userId length:', userId?.length);
    logger.info('[StudentController.getEnrolledWithoutOpenProjection] req.clerkUserId:', req.clerkUserId);

    if (!userId) {
      logger.error('[StudentController.getEnrolledWithoutOpenProjection] userId is missing');
      throw new InvalidEntityError('User', 'User ID is required');
    }

    logger.info('[StudentController.getEnrolledWithoutOpenProjection] Validating UUID for userId:', userId);
    validateUuid(userId, 'User');
    const result = await this.getEnrolledWithoutOpenProjectionUseCase.execute(userId);
    if (!result.success) {
      throw result.error;
    }
    return res.status(200).json(result.data);
  }
}