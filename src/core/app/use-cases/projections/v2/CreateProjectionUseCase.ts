import { ProjectionRepository, SchoolRepository, SchoolYearRepository, StudentRepository } from '../../../../adapters_interface/repositories/v2';
import { SchoolYearStatusEnum } from '../../../../domain/entities/v2/SchoolYear';
import { ObjectAlreadyExistsError } from '../../../errors/v2/ObjectAlreadyExistsError';
import { container } from '../../../../frameworks/di/v2/container';
import { InvalidEntityError } from '../../../errors/v2';

export class CreateProjectionUseCase {
  constructor(
    private readonly projectionRepository: ProjectionRepository = container.repository.projectionRepository,
    private readonly studentRepository: StudentRepository = container.repository.studentRepository,
    private readonly schoolRepository: SchoolRepository = container.repository.schoolRepository,
    private readonly schoolYearRepository: SchoolYearRepository = container.repository.schoolYearRepository,
  ) { }

  async execute(input: {
    studentId: string;
    schoolId: string;
    schoolYear: string;
  }) {
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
    if (schoolYear.status !== SchoolYearStatusEnum.CURRENT_YEAR) {
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
