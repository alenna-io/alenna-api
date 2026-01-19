import {
  PrismaProjectionRepository,
  PrismaSchoolRepository,
  PrismaSchoolYearRepository,
  PrismaStudentRepository,
} from '../../../infrastructure/repositories';
import { InvalidEntityError, ObjectAlreadyExistsError } from '../../../domain/errors';
import { CreateProjectionInput } from '../../../application/dtos/projections/CreateProjectionInput';

export class CreateProjectionUseCase {
  constructor(
    private readonly projectionRepository: PrismaProjectionRepository,
    private readonly studentRepository: PrismaStudentRepository,
    private readonly schoolRepository: PrismaSchoolRepository,
    private readonly schoolYearRepository: PrismaSchoolYearRepository,
  ) { }

  async execute(input: CreateProjectionInput) {
    // Validate student
    const student = await this.studentRepository.findById(input.studentId);
    if (!student) {
      throw new InvalidEntityError('Student', 'Student not found; cannot create projection.');
    }

    // Validate school
    const school = await this.schoolRepository.findById(input.schoolId);
    if (!school) {
      throw new InvalidEntityError('School', 'School not found; cannot create projection.');
    }

    // Validate student is in school
    if (student.schoolId !== input.schoolId) {
      throw new InvalidEntityError('Student', 'Student not found in this school; cannot create projection.');
    }

    // Validate school year
    const schoolYear = await this.schoolYearRepository.findById(input.schoolYear);
    if (!schoolYear) {
      throw new InvalidEntityError('SchoolYear', 'School year not found; cannot create projection.');
    }

    // Validate school year is active
    if (schoolYear.status !== 'CURRENT_YEAR') {
      throw new InvalidEntityError('SchoolYear', 'School year is not active; cannot create projection.');
    }

    const existing =
      await this.projectionRepository.findActiveByStudent(
        input.studentId,
        input.schoolId,
        input.schoolYear
      );

    if (existing) {
      throw new ObjectAlreadyExistsError('Projection', 'A projection already exists for this student in this school year.');
    }
    return this.projectionRepository.create(input);
  }
}
