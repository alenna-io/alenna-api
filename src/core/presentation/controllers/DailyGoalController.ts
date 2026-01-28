import { Request, Response } from 'express';
import { container } from '../../infrastructure/frameworks/di/container';
import { GetDailyGoalsInputSchema } from '../../application/dtos/daily-goals/GetDailyGoalsInput';
import { GetDailyGoalsUseCase } from '../../application/use-cases/projections/GetDailyGoalsUseCase';
import { InvalidEntityError } from '../../domain/errors';
import { validateCuid } from '../../domain/utils/validation';

export class DailyGoalController {
  constructor(
    private readonly getDailyGoals: GetDailyGoalsUseCase = container.useCase.getDailyGoalsUseCase
  ) { }

  async getDailyGoalsHandler(req: Request, res: Response): Promise<Response> {
    const { projectionId, quarter, week } = req.query;

    if (!projectionId || typeof projectionId !== 'string') {
      throw new InvalidEntityError('Query', 'Projection ID query parameter is required');
    }

    validateCuid(projectionId, 'Projection');

    if (!quarter || typeof quarter !== 'string') {
      throw new InvalidEntityError('Query', 'Quarter query parameter is required');
    }

    if (!week || isNaN(Number(week))) {
      throw new InvalidEntityError('Query', 'Week query parameter is required and must be a number');
    }

    const input = GetDailyGoalsInputSchema.parse({
      quarter,
      week: parseInt(week as string, 10),
    });

    const result = await this.getDailyGoals.execute(projectionId, input);

    if (!result.success) {
      throw result.error;
    }

    return res.status(200).json(result.data);
  }
}
