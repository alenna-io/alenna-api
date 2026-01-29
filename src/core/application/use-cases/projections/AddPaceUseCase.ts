import { IProjectionRepository, IPaceCatalogRepository } from '../../../domain/interfaces/repositories';
import { InvalidEntityError, ObjectNotFoundError, ObjectAlreadyExistsError, DomainError } from '../../../domain/errors';
import { AddPaceInput } from '../../../application/dtos/projections/AddPaceInput';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import { Prisma } from '@prisma/client';

export class AddPaceUseCase {
  constructor(
    private readonly projectionRepository: IProjectionRepository,
    private readonly paceCatalogRepository: IPaceCatalogRepository,
  ) { }

  async execute(projectionId: string, schoolId: string, input: AddPaceInput): Promise<Result<Prisma.ProjectionPaceGetPayload<{}>, DomainError>> {
    try {
      validateCuid(projectionId, 'Projection');
      validateCuid(schoolId, 'School');
      validateCuid(input.paceCatalogId, 'PaceCatalog');

      const projection = await this.projectionRepository.findById(projectionId, schoolId);
      if (!projection) {
        return Err(new ObjectNotFoundError('Projection', `Projection with ID ${projectionId} not found`));
      }

      if (projection.status !== 'OPEN') {
        return Err(new InvalidEntityError('Projection', 'Cannot edit closed projection'));
      }

      const paceCatalog = await this.paceCatalogRepository.findById(input.paceCatalogId);
      if (!paceCatalog) {
        return Err(new ObjectNotFoundError('PaceCatalog', `Pace catalog with ID ${input.paceCatalogId} not found`));
      }

      const existingPace = projection.projectionPaces.find(
        p => !p.deletedAt && p.paceCatalogId === input.paceCatalogId
      );
      if (existingPace) {
        return Err(new ObjectAlreadyExistsError('ProjectionPace', 'This pace is already in the projection'));
      }

      const categoryName = paceCatalog.subject.category.name;
      const newPaceOrderIndex = paceCatalog.orderIndex;
      const isElectivesCategory = categoryName === 'Electives';

      // For non-Electives categories, validate orderIndex across the entire category
      // For Electives, skip order validation (no sequential order required)
      const allPacesInCategory = isElectivesCategory
        ? [] // Skip validation for Electives
        : projection.projectionPaces.filter(
          p => !p.deletedAt && p.paceCatalog.subject.category.name === categoryName
        );

      const normalizeQuarter = (q: string) => q.startsWith('Q') ? q : `Q${q}`;
      const normalizedTargetQuarter = normalizeQuarter(input.quarter);

      // Only validate if not Electives
      if (!isElectivesCategory) {
        const targetWeekPace = allPacesInCategory.find(
          p => normalizeQuarter(p.quarter) === normalizedTargetQuarter && p.week === input.week
        );

        if (targetWeekPace) {
          const targetPaceOrderIndex = targetWeekPace.paceCatalog.orderIndex;
          if (targetPaceOrderIndex > newPaceOrderIndex) {
            return Err(new InvalidEntityError('ProjectionPace', `Cannot add pace: cannot place pace with orderIndex ${newPaceOrderIndex} at position that already has pace with orderIndex ${targetPaceOrderIndex}`));
          }
        }

        const immediatePaceBefore = allPacesInCategory
          .filter(p => {
            const normalizedPaceQuarter = normalizeQuarter(p.quarter);
            if (normalizedPaceQuarter < normalizedTargetQuarter) return true;
            if (normalizedPaceQuarter === normalizedTargetQuarter && p.week < input.week) return true;
            return false;
          })
          .sort((a, b) => {
            const aQuarter = normalizeQuarter(a.quarter);
            const bQuarter = normalizeQuarter(b.quarter);
            if (aQuarter !== bQuarter) return bQuarter.localeCompare(aQuarter);
            return b.week - a.week;
          })
          .shift();

        if (immediatePaceBefore && immediatePaceBefore.paceCatalog.orderIndex > newPaceOrderIndex) {
          const orderIndexDiff = immediatePaceBefore.paceCatalog.orderIndex - newPaceOrderIndex;
          const weekDiff = input.week - immediatePaceBefore.week;
          const isImmediatelyAfter = normalizedTargetQuarter === normalizeQuarter(immediatePaceBefore.quarter) && weekDiff === 1;

          if (orderIndexDiff >= 1 && isImmediatelyAfter) {
            return Err(new InvalidEntityError('ProjectionPace', `Cannot add pace: cannot place pace with orderIndex ${newPaceOrderIndex} after pace with orderIndex ${immediatePaceBefore.paceCatalog.orderIndex} (at ${immediatePaceBefore.quarter} week ${immediatePaceBefore.week})`));
          }
        }

        // Check if there's any pace after this position with lower orderIndex
        // This prevents placing a higher orderIndex pace before a lower orderIndex pace
        const pacesAfter = allPacesInCategory
          .filter(p => {
            const normalizedPaceQuarter = normalizeQuarter(p.quarter);
            if (normalizedPaceQuarter > normalizedTargetQuarter) return true;
            if (normalizedPaceQuarter === normalizedTargetQuarter && p.week > input.week) return true;
            return false;
          });

        // Check if any pace after has a lower orderIndex
        const paceAfterWithLowerOrder = pacesAfter.find(p => p.paceCatalog.orderIndex < newPaceOrderIndex);
        if (paceAfterWithLowerOrder) {
          return Err(new InvalidEntityError('ProjectionPace', `Cannot add pace: cannot place pace with orderIndex ${newPaceOrderIndex} before pace with orderIndex ${paceAfterWithLowerOrder.paceCatalog.orderIndex} (at ${paceAfterWithLowerOrder.quarter} week ${paceAfterWithLowerOrder.week})`));
        }
      }

      const addedPace = await this.projectionRepository.addPace(projectionId, input.paceCatalogId, input.quarter, input.week);
      return Ok(addedPace);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectNotFoundError || error instanceof ObjectAlreadyExistsError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}
