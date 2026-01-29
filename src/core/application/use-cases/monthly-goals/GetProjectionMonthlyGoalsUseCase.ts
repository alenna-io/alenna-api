import { IMonthlyGoalRepository, IProjectionRepository } from '../../../domain/interfaces/repositories';
import { InvalidEntityError, ObjectNotFoundError, DomainError } from '../../../domain/errors';
import { GetProjectionMonthlyGoalsOutput } from '../../dtos/monthly-goals';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';

export class GetProjectionMonthlyGoalsUseCase {
  constructor(
    private readonly monthlyGoalRepository: IMonthlyGoalRepository,
    private readonly projectionRepository: IProjectionRepository,
  ) { }

  async execute(
    projectionId: string,
    schoolId: string
  ): Promise<Result<GetProjectionMonthlyGoalsOutput, DomainError>> {
    try {
      validateCuid(projectionId, 'Projection');
      validateCuid(schoolId, 'School');

      const projection = await this.projectionRepository.findById(projectionId, schoolId);
      if (!projection) {
        return Err(new ObjectNotFoundError('Projection', 'Projection not found'));
      }

      const monthlyGoals = await this.monthlyGoalRepository.findByProjection(projectionId);
      return Ok(monthlyGoals);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}
