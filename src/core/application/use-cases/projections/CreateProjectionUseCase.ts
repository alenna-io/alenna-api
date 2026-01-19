import {
  IProjectionRepository,
  IStudentRepository,
  ISchoolRepository,
  ISchoolYearRepository,
} from '../../../domain/interfaces/repositories';
import { InvalidEntityError, ObjectAlreadyExistsError, ObjectNotFoundError, DomainError } from '../../../domain/errors';
import { CreateProjectionInput } from '../../../application/dtos/projections/CreateProjectionInput';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import { Prisma } from '@prisma/client';

export class CreateProjectionUseCase {
  constructor(
    private readonly projectionRepository: IProjectionRepository,
    private readonly studentRepository: IStudentRepository,
    private readonly schoolRepository: ISchoolRepository,
    private readonly schoolYearRepository: ISchoolYearRepository,
  ) { }

  async execute(input: CreateProjectionInput): Promise<Result<Prisma.ProjectionGetPayload<{}>, DomainError>> {
    try {
      validateCuid(input.studentId, 'Student');
      validateCuid(input.schoolId, 'School');
      validateCuid(input.schoolYear, 'SchoolYear');

      // Validate student
      const student = await this.studentRepository.findById(input.studentId);
      if (!student) {
        return Err(new InvalidEntityError('Student', 'Student not found; cannot create projection.'));
      }

      // Validate school
      const school = await this.schoolRepository.findById(input.schoolId);
      if (!school) {
        return Err(new InvalidEntityError('School', 'School not found; cannot create projection.'));
      }

      // Validate student is in school
      if (student.schoolId !== input.schoolId) {
        return Err(new InvalidEntityError('Student', 'Student not found in this school; cannot create projection.'));
      }

      // Validate school year
      const schoolYear = await this.schoolYearRepository.findById(input.schoolYear);
      if (!schoolYear) {
        return Err(new InvalidEntityError('SchoolYear', 'School year not found; cannot create projection.'));
      }

      // Validate school year is active
      if (schoolYear.status !== 'CURRENT_YEAR') {
        return Err(new InvalidEntityError('SchoolYear', 'School year is not active; cannot create projection.'));
      }

      const existing =
        await this.projectionRepository.findActiveByStudent(
          input.studentId,
          input.schoolId,
          input.schoolYear
        );

      if (existing) {
        return Err(new ObjectAlreadyExistsError('Projection', 'A projection already exists for this student in this school year.'));
      }

      const projection = await this.projectionRepository.create(input);
      return Ok(projection);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectAlreadyExistsError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}
