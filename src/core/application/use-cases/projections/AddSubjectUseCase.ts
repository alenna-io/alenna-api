import { IProjectionRepository, ISubjectRepository, ICategoryRepository } from '../../../domain/interfaces/repositories';
import { InvalidEntityError, ObjectNotFoundError, DomainError } from '../../../domain/errors';
import { AddSubjectInput } from '../../dtos/projections/AddSubjectInput';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import { ProjectionWithDetails } from '../../../infrastructure/repositories/types/projections.types';

export class AddSubjectUseCase {
  constructor(
    private readonly projectionRepository: IProjectionRepository,
    private readonly subjectRepository: ISubjectRepository,
    private readonly categoryRepository: ICategoryRepository,
  ) { }

  async execute(projectionId: string, schoolId: string, input: AddSubjectInput): Promise<Result<{ success: boolean }, DomainError>> {
    try {
      validateCuid(projectionId, 'Projection');
      validateCuid(schoolId, 'School');
      validateCuid(input.subjectId, 'Subject');

      const projection = await this.projectionRepository.findById(projectionId, schoolId);
      if (!projection) {
        return Err(new ObjectNotFoundError('Projection', `Projection with ID ${projectionId} not found`));
      }

      if (projection.status !== 'OPEN') {
        return Err(new InvalidEntityError('Projection', 'Cannot edit closed projection'));
      }

      // Count unique subjects in the projection (from both paces and projectionSubjects)
      const subjectsFromPaces = new Set(
        projection.projectionPaces
          .filter(p => !p.deletedAt)
          .map(p => p.paceCatalog.subjectId)
      );

      const subjectsFromProjectionSubjects = new Set<string>()
      // ProjectionWithDetails includes projectionSubjects, but TypeScript needs explicit typing
      const projectionWithSubjects = projection as ProjectionWithDetails
      if ('projectionSubjects' in projectionWithSubjects && projectionWithSubjects.projectionSubjects) {
        const projectionSubjectsArray = projectionWithSubjects.projectionSubjects as Array<{ deletedAt: Date | null; subjectId: string }>
        for (const ps of projectionSubjectsArray) {
          if (!ps.deletedAt) {
            subjectsFromProjectionSubjects.add(ps.subjectId)
          }
        }
      }

      const uniqueSubjects = new Set([...subjectsFromPaces, ...subjectsFromProjectionSubjects]);

      // Validate subject exists
      const subject = await this.subjectRepository.findById(input.subjectId);
      if (!subject) {
        return Err(new ObjectNotFoundError('Subject', `Subject with ID ${input.subjectId} not found`));
      }

      // Get category to determine validation logic
      const categories = await this.categoryRepository.findManyByIds([subject.categoryId]);
      const category = categories[0];

      if (!category) {
        return Err(new ObjectNotFoundError('Category', `Category with ID ${subject.categoryId} not found`));
      }

      const isElectivesCategory = category.name === 'Electives';

      if (isElectivesCategory) {
        // For Electives: Check if this specific subjectId already exists
        if (uniqueSubjects.has(input.subjectId)) {
          return Err(new InvalidEntityError('Projection', 'This elective subject is already in the projection'));
        }
      } else {
        // For non-Electives: Check if ANY subject from this category already exists in ProjectionSubject
        // Get all existing ProjectionSubjects and check their categories
        const existingCategories = new Set<string>();

        // Check categories from projectionSubjects
        if ('projectionSubjects' in projectionWithSubjects && projectionWithSubjects.projectionSubjects) {
          const projectionSubjectsArray = projectionWithSubjects.projectionSubjects as Array<{
            deletedAt: Date | null;
            subject: {
              categoryId: string;
            };
          }>;
          for (const ps of projectionSubjectsArray) {
            if (!ps.deletedAt && ps.subject) {
              existingCategories.add(ps.subject.categoryId);
            }
          }
        }

        // Check categories from paces
        for (const pace of projection.projectionPaces) {
          if (!pace.deletedAt && pace.paceCatalog?.subject?.categoryId) {
            existingCategories.add(pace.paceCatalog.subject.categoryId);
          }
        }

        // If this category already has a representative, reject
        if (existingCategories.has(subject.categoryId)) {
          return Err(new InvalidEntityError('Projection', 'This category already has a representative subject in the projection'));
        }
      }

      // Add the subject to the projection (creates ProjectionSubject record)
      await this.projectionRepository.addSubject(projectionId, input.subjectId);

      // Return success - no paces are added initially
      // The frontend will display an empty row for this subject
      return Ok({ success: true });
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}
