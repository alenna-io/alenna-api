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

      const immediatePaceBefore = allPacesInSubject
        .filter(p => {
          if (p.id === paceId) return false;
          const normalizedPaceQuarter = normalizeQuarter(p.quarter);
          const isBefore = normalizedPaceQuarter < normalizedTargetQuarter ||
            (normalizedPaceQuarter === normalizedTargetQuarter && p.week < input.week);
          return isBefore;
        })
        .sort((a, b) => {
          const aQuarter = normalizeQuarter(a.quarter);
          const bQuarter = normalizeQuarter(b.quarter);
          if (aQuarter !== bQuarter) return bQuarter.localeCompare(aQuarter);
          return b.week - a.week;
        })
        .shift();

      if (immediatePaceBefore && immediatePaceBefore.paceCatalog.orderIndex > movingPaceOrderIndex) {
        const orderIndexDiff = immediatePaceBefore.paceCatalog.orderIndex - movingPaceOrderIndex;
        const weekDiff = input.week - immediatePaceBefore.week;
        const isImmediatelyAfter = normalizedTargetQuarter === normalizeQuarter(immediatePaceBefore.quarter) && weekDiff === 1;

        if (orderIndexDiff >= 2 && isImmediatelyAfter) {
          // Check if there's a soft-deleted pace with orderIndex between movingPaceOrderIndex and immediatePaceBefore's orderIndex
          const allPacesIncludingDeleted = projection.projectionPaces.filter(
            p => p.paceCatalog.subject.id === subjectId && p.id !== paceId
          );
          const hasSoftDeletedPaceInBetween = allPacesIncludingDeleted.some(p => {
            if (!p.deletedAt) return false;
            const paceOrderIndex = p.paceCatalog.orderIndex;
            return paceOrderIndex > movingPaceOrderIndex && paceOrderIndex < immediatePaceBefore.paceCatalog.orderIndex;
          });

          if (!hasSoftDeletedPaceInBetween) {
            return Err(new InvalidEntityError('ProjectionPace', `Cannot move pace: cannot place pace with orderIndex ${movingPaceOrderIndex} after pace with orderIndex ${immediatePaceBefore.paceCatalog.orderIndex} (at ${immediatePaceBefore.quarter} week ${immediatePaceBefore.week})`));
          }
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
