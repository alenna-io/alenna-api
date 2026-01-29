import { IMonthlyAssignmentRepository, IProjectionRepository } from '../../../domain/interfaces/repositories';
import { InvalidEntityError, ObjectNotFoundError, DomainError } from '../../../domain/errors';
import { UpdateMonthlyAssignmentGradeInput } from '../../dtos/monthly-assignments';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import { Prisma, ProjectionStatus } from '@prisma/client';

export class UpdateMonthlyAssignmentGradeUseCase {
  constructor(
    private readonly monthlyAssignmentRepository: IMonthlyAssignmentRepository,
    private readonly projectionRepository: IProjectionRepository,
  ) { }

  async execute(
    projectionId: string,
    schoolId: string,
    monthlyAssignmentId: string,
    input: UpdateMonthlyAssignmentGradeInput
  ): Promise<Result<Prisma.ProjectionMonthlyAssignmentGetPayload<{}>, DomainError>> {
    try {
      validateCuid(projectionId, 'Projection');
      validateCuid(schoolId, 'School');
      validateCuid(monthlyAssignmentId, 'ProjectionMonthlyAssignment');

      const projection = await this.projectionRepository.findById(projectionId, schoolId);
      if (!projection) {
        return Err(new ObjectNotFoundError('Projection', 'Projection not found'));
      }

      if (projection.status !== ProjectionStatus.OPEN) {
        return Err(new InvalidEntityError('Projection', 'Cannot edit closed projection'));
      }

      const updatedAssignment = await this.monthlyAssignmentRepository.updateGrade(
        projectionId,
        monthlyAssignmentId,
        input.grade
      );

      return Ok(updatedAssignment);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}
