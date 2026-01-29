import { IMonthlyGoalRepository, IProjectionRepository } from '../../../domain/interfaces/repositories';
import { InvalidEntityError, ObjectNotFoundError, DomainError } from '../../../domain/errors';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import { Prisma, ProjectionStatus } from '@prisma/client';

export class MarkMonthlyGoalUngradedUseCase {
  constructor(
    private readonly monthlyGoalRepository: IMonthlyGoalRepository,
    private readonly projectionRepository: IProjectionRepository,
  ) { }

  async execute(
    projectionId: string,
    schoolId: string,
    monthlyGoalId: string
  ): Promise<Result<Prisma.ProjectionMonthlyGoalGetPayload<{}>, DomainError>> {
    try {
      validateCuid(projectionId, 'Projection');
      validateCuid(schoolId, 'School');
      validateCuid(monthlyGoalId, 'ProjectionMonthlyGoal');

      const projection = await this.projectionRepository.findById(projectionId, schoolId);
      if (!projection) {
        return Err(new ObjectNotFoundError('Projection', 'Projection not found'));
      }

      if (projection.status !== ProjectionStatus.OPEN) {
        return Err(new InvalidEntityError('Projection', 'Cannot edit closed projection'));
      }

      const updatedGoal = await this.monthlyGoalRepository.markUngraded(
        projectionId,
        monthlyGoalId
      );

      return Ok(updatedGoal);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}
