import { IMonthlyAssignmentRepository, ISchoolYearRepository } from '../../../domain/interfaces/repositories';
import { InvalidEntityError, ObjectNotFoundError, DomainError } from '../../../domain/errors';
import { CreateMonthlyAssignmentTemplateInput } from '../../dtos/monthly-assignments';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import { Prisma } from '@prisma/client';

export class CreateMonthlyAssignmentTemplateUseCase {
  constructor(
    private readonly monthlyAssignmentRepository: IMonthlyAssignmentRepository,
    private readonly schoolYearRepository: ISchoolYearRepository,
  ) { }

  async execute(
    schoolYearId: string,
    schoolId: string,
    input: CreateMonthlyAssignmentTemplateInput
  ): Promise<Result<Prisma.MonthlyAssignmentTemplateGetPayload<{}>, DomainError>> {
    try {
      validateCuid(schoolYearId, 'SchoolYear');
      validateCuid(schoolId, 'School');

      const schoolYear = await this.schoolYearRepository.findById(schoolYearId, schoolId);
      if (!schoolYear) {
        return Err(new ObjectNotFoundError('SchoolYear', 'School year not found'));
      }

      if (schoolYear.status !== 'CURRENT_YEAR') {
        return Err(new InvalidEntityError('SchoolYear', 'School year is not active'));
      }

      const template = await this.monthlyAssignmentRepository.createTemplate(
        schoolYearId,
        schoolId,
        { name: input.name, quarter: input.quarter, month: input.month }
      );

      return Ok(template);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      // Prisma errors will be handled by the error handler middleware
      throw error;
    }
  }
}
