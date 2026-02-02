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

      if (uniqueSubjects.size >= 7) {
        return Err(new InvalidEntityError('Projection', 'Maximum of 7 subjects allowed in a projection'));
      }

      // Validate subject exists
      const subject = await this.subjectRepository.findById(input.subjectId);
      if (!subject) {
        return Err(new ObjectNotFoundError('Subject', `Subject with ID ${input.subjectId} not found`));
      }

      // Check if subject is already in the projection
      if (uniqueSubjects.has(input.subjectId)) {
        return Err(new InvalidEntityError('Projection', 'This subject is already in the projection'));
      }

      // Get category to check if it's Electives
      const categories = await this.categoryRepository.findManyByIds([subject.categoryId]);
      const category = categories[0];

      if (!category || category.name !== 'Electives') {
        return Err(new InvalidEntityError('Subject', 'Only Elective subjects can be added this way'));
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
