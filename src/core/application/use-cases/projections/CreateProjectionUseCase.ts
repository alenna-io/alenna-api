import {
  IProjectionRepository,
  IStudentRepository,
  ISchoolRepository,
  ISchoolYearRepository,
  IMonthlyAssignmentRepository,
} from '../../../domain/interfaces/repositories';
import { InvalidEntityError, ObjectAlreadyExistsError, ObjectNotFoundError, DomainError } from '../../../domain/errors';
import { CreateProjectionInput } from '../../../application/dtos/projections/CreateProjectionInput';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import { Prisma, ProjectionMonthlyAssignmentStatus } from '@prisma/client';
import prisma from '../../../infrastructure/database/prisma.client';
import { PrismaTransaction } from '../../../infrastructure/database/PrismaTransaction';

export class CreateProjectionUseCase {
  constructor(
    private readonly projectionRepository: IProjectionRepository,
    private readonly studentRepository: IStudentRepository,
    private readonly schoolRepository: ISchoolRepository,
    private readonly schoolYearRepository: ISchoolYearRepository,
    private readonly monthlyAssignmentRepository: IMonthlyAssignmentRepository,
  ) { }

  async execute(input: CreateProjectionInput): Promise<Result<Prisma.ProjectionGetPayload<{}>, DomainError>> {
    try {
      validateCuid(input.studentId, 'Student');
      validateCuid(input.schoolId, 'School');
      validateCuid(input.schoolYear, 'SchoolYear');

      // Validate student
      const student = await this.studentRepository.findById(input.studentId, input.schoolId);
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
      const schoolYear = await this.schoolYearRepository.findById(input.schoolYear, input.schoolId);
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

      const projection = await prisma.$transaction(async (tx) => {
        const createdProjection = await this.projectionRepository.create(input, tx as PrismaTransaction);

        // Assign existing monthly assignment templates to the new projection
        const existingTemplates = await this.monthlyAssignmentRepository.findTemplatesBySchoolYear(
          input.schoolYear,
          tx as PrismaTransaction
        );

        if (existingTemplates.length > 0) {
          await tx.projectionMonthlyAssignment.createMany({
            data: existingTemplates.map((template) => ({
              projectionId: createdProjection.id,
              monthlyAssignmentTemplateId: template.id,
              status: ProjectionMonthlyAssignmentStatus.PENDING,
            })),
            skipDuplicates: true,
          });
        }

        return createdProjection;
      });

      return Ok(projection);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectAlreadyExistsError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}
