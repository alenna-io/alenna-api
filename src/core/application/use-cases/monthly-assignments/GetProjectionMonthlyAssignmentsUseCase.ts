import { IMonthlyAssignmentRepository, IProjectionRepository } from '../../../domain/interfaces/repositories';
import { InvalidEntityError, ObjectNotFoundError, DomainError } from '../../../domain/errors';
import { GetProjectionMonthlyAssignmentsOutput } from '../../dtos/monthly-assignments';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';

export class GetProjectionMonthlyAssignmentsUseCase {
  constructor(
    private readonly monthlyAssignmentRepository: IMonthlyAssignmentRepository,
    private readonly projectionRepository: IProjectionRepository,
  ) { }

  async execute(
    projectionId: string,
    schoolId: string
  ): Promise<Result<GetProjectionMonthlyAssignmentsOutput, DomainError>> {
    try {
      validateCuid(projectionId, 'Projection');
      validateCuid(schoolId, 'School');

      const projection = await this.projectionRepository.findById(projectionId, schoolId);
      if (!projection) {
        return Err(new ObjectNotFoundError('Projection', 'Projection not found'));
      }

      const monthlyAssignments = await this.monthlyAssignmentRepository.findByProjection(projectionId);
      return Ok(monthlyAssignments);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}
