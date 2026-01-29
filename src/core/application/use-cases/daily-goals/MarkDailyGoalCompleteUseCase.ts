import { IDailyGoalRepository } from '../../../domain/interfaces/repositories';
import { ObjectNotFoundError, DomainError } from '../../../domain/errors';
import { MarkCompleteInput } from '../../dtos/daily-goals/MarkCompleteInput';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import { Prisma } from '@prisma/client';

export class MarkDailyGoalCompleteUseCase {
  constructor(
    private readonly dailyGoalRepository: IDailyGoalRepository,
  ) { }

  async execute(dailyGoalId: string, schoolId: string, input: MarkCompleteInput): Promise<Result<Prisma.DailyGoalGetPayload<{}>, DomainError>> {
    try {
      validateCuid(dailyGoalId, 'DailyGoal');
      validateCuid(schoolId, 'School');

      const existingGoal = await this.dailyGoalRepository.findById(dailyGoalId, schoolId);

      if (!existingGoal) {
        return Err(new ObjectNotFoundError('DailyGoal', `Daily goal with ID ${dailyGoalId} not found`));
      }

      const updatedGoal = await this.dailyGoalRepository.markComplete(dailyGoalId, input.isCompleted, schoolId);
      return Ok(updatedGoal);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}
