import { IProjectionRepository } from '../../../domain/interfaces/repositories';
import { InvalidEntityError, ObjectNotFoundError, DomainError } from '../../../domain/errors';
import { MovePaceInput } from '../../../application/dtos/projections/MovePaceInput';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import { Prisma } from '@prisma/client';

export class MovePaceUseCase {
  constructor(
    private readonly projectionRepository: IProjectionRepository,
  ) { }

  async execute(projectionId: string, paceId: string, input: MovePaceInput): Promise<Result<Prisma.ProjectionPaceGetPayload<{}>, DomainError>> {
    try {
      validateCuid(projectionId, 'Projection');
      validateCuid(paceId, 'ProjectionPace');

      const projection = await this.projectionRepository.findById(projectionId);
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

      const paceCatalog = pace.paceCatalog;
      const subjectId = paceCatalog.subject.id;
      const movingPaceOrderIndex = paceCatalog.orderIndex;

      const allPacesInSubject = projection.projectionPaces.filter(
        p => !p.deletedAt && p.paceCatalog.subject.id === subjectId
      );

      const normalizeQuarter = (q: string) => q.startsWith('Q') ? q : `Q${q}`;
      const normalizedTargetQuarter = normalizeQuarter(input.quarter);

      const targetWeekPace = allPacesInSubject.find(
        p => normalizeQuarter(p.quarter) === normalizedTargetQuarter && p.week === input.week && p.id !== paceId
      );

      if (targetWeekPace) {
        const targetPaceOrderIndex = targetWeekPace.paceCatalog.orderIndex;
        if (targetPaceOrderIndex > movingPaceOrderIndex) {
          return Err(new InvalidEntityError('ProjectionPace', `Cannot move pace: cannot place pace with orderIndex ${movingPaceOrderIndex} at position that already has pace with orderIndex ${targetPaceOrderIndex}`));
        }
      }

      const pacesBeforeTarget = allPacesInSubject.filter(p => {
        if (p.id === paceId) return false;
        const normalizedPaceQuarter = normalizeQuarter(p.quarter);
        const isBefore = normalizedPaceQuarter < normalizedTargetQuarter ||
          (normalizedPaceQuarter === normalizedTargetQuarter && p.week < input.week);
        return isBefore;
      });

      for (const paceBefore of pacesBeforeTarget) {
        if (paceBefore.paceCatalog.orderIndex > movingPaceOrderIndex) {
          return Err(new InvalidEntityError('ProjectionPace', `Cannot move pace: cannot place pace with orderIndex ${movingPaceOrderIndex} after pace with orderIndex ${paceBefore.paceCatalog.orderIndex} (at ${paceBefore.quarter} week ${paceBefore.week})`));
        }
      }

      const updatedPace = await this.projectionRepository.movePace(projectionId, paceId, input.quarter, input.week);
      return Ok(updatedPace);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}
