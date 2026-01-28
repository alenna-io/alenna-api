import { IProjectionRepository } from '../../../domain/interfaces/repositories';
import { InvalidEntityError, ObjectNotFoundError, DomainError } from '../../../domain/errors';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import { Prisma, ProjectionStatus } from '@prisma/client';

export class MarkUngradedUseCase {
  constructor(
    private readonly projectionRepository: IProjectionRepository,
  ) { }

  async execute(projectionId: string, paceId: string): Promise<Result<Prisma.ProjectionPaceGetPayload<{}>, DomainError>> {
    try {
      validateCuid(projectionId, 'Projection');
      validateCuid(paceId, 'ProjectionPace');

      const projection = await this.projectionRepository.findById(projectionId);
      if (!projection) {
        return Err(new ObjectNotFoundError('Projection', `Projection with ID ${projectionId} not found`));
      }

      if (projection.status !== ProjectionStatus.OPEN) {
        return Err(new InvalidEntityError('Projection', 'Cannot edit closed projection'));
      }

      const pace = projection.projectionPaces.find(p => p.id === paceId && !p.deletedAt);
      if (!pace) {
        return Err(new ObjectNotFoundError('ProjectionPace', `Pace with ID ${paceId} not found in projection`));
      }

      const updatedPace = await this.projectionRepository.markUngraded(projectionId, paceId);
      return Ok(updatedPace);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}
