import { IProjectionRepository, IDailyGoalRepository } from '../../../domain/interfaces/repositories';
import { InvalidEntityError, ObjectNotFoundError, DomainError } from '../../../domain/errors';
import { CreateDailyGoalInput } from '../../dtos/daily-goals/CreateDailyGoalInput';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import { Prisma } from '@prisma/client';

export class CreateDailyGoalUseCase {
  constructor(
    private readonly projectionRepository: IProjectionRepository,
    private readonly dailyGoalRepository: IDailyGoalRepository,
  ) { }

  async execute(projectionId: string, schoolId: string, input: CreateDailyGoalInput): Promise<Result<Prisma.DailyGoalGetPayload<{}>, DomainError>> {
    try {
      validateCuid(projectionId, 'Projection');
      validateCuid(schoolId, 'School');

      const projection = await this.projectionRepository.findById(projectionId, schoolId);
      if (!projection) {
        return Err(new ObjectNotFoundError('Projection', `Projection with ID ${projectionId} not found`));
      }

      if (projection.status !== 'OPEN') {
        return Err(new InvalidEntityError('Projection', 'Cannot edit closed projection'));
      }

      const dailyGoal = await this.dailyGoalRepository.create(
        projectionId,
        input.subject,
        input.quarter,
        input.week,
        input.dayOfWeek,
        input.text
      );

      return Ok(dailyGoal);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}
