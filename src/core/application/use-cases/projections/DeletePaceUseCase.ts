import { IProjectionRepository } from '../../../domain/interfaces/repositories';
import { InvalidEntityError, ObjectNotFoundError, DomainError } from '../../../domain/errors';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';

export class DeletePaceUseCase {
  constructor(
    private readonly projectionRepository: IProjectionRepository,
  ) { }

  async execute(projectionId: string, schoolId: string, paceId: string): Promise<Result<void, DomainError>> {
    try {
      validateCuid(projectionId, 'Projection');
      validateCuid(schoolId, 'School');
      validateCuid(paceId, 'ProjectionPace');

      const projection = await this.projectionRepository.findById(projectionId, schoolId);
      if (!projection) {
        return Err(new ObjectNotFoundError('Projection', `Projection with ID ${projectionId} not found`));
      }

      if (projection.status !== 'OPEN') {
        return Err(new InvalidEntityError('Projection', 'Cannot edit closed projection'));
      }

      const pace = projection.projectionPaces.find(p => p.id === paceId && !p.deletedAt);
      if (!pace) {
        return Err(new ObjectNotFoundError('ProjectionPace', `Pace with ID ${paceId} not found in projection`));
      }

      if (pace.grade !== null || pace.status !== 'PENDING') {
        return Err(new InvalidEntityError('ProjectionPace', 'Cannot delete graded pace'));
      }

      await this.projectionRepository.deletePace(projectionId, paceId);
      return Ok(undefined);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}
