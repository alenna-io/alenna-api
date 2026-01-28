import { IProjectionRepository, IDailyGoalRepository } from '../../../domain/interfaces/repositories';
import { ObjectNotFoundError, DomainError } from '../../../domain/errors';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import { GetDailyGoalsInput, GetDailyGoalsOutput } from '../../dtos/daily-goals';

export class GetDailyGoalsUseCase {
  constructor(
    private readonly projectionRepository: IProjectionRepository,
    private readonly dailyGoalRepository: IDailyGoalRepository,
  ) { }

  async execute(projectionId: string, input: GetDailyGoalsInput): Promise<Result<GetDailyGoalsOutput, DomainError>> {
    try {
      validateCuid(projectionId, 'Projection');

      const projection = await this.projectionRepository.findById(projectionId);
      if (!projection) {
        return Err(new ObjectNotFoundError('Projection', `Projection with ID ${projectionId} not found`));
      }

      const dailyGoals = await this.dailyGoalRepository.findDailyGoalsByWeek(
        projectionId,
        input.quarter,
        input.week
      );

      const output: GetDailyGoalsOutput = dailyGoals.map(goal => ({
        id: goal.id,
        subject: goal.subject,
        quarter: goal.quarter,
        week: goal.week,
        dayOfWeek: goal.dayOfWeek,
        text: goal.text,
        isCompleted: goal.isCompleted,
        notes: goal.notes,
        notesCompleted: goal.notesCompleted,
      }));

      return Ok(output);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}
