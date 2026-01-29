import { IMonthlyGoalRepository, ISchoolYearRepository } from '../../../domain/interfaces/repositories';
import { InvalidEntityError, ObjectNotFoundError, DomainError } from '../../../domain/errors';
import { CreateMonthlyGoalTemplateInput } from '../../dtos/monthly-goals';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import { Prisma } from '@prisma/client';

export class CreateMonthlyGoalTemplateUseCase {
  constructor(
    private readonly monthlyGoalRepository: IMonthlyGoalRepository,
    private readonly schoolYearRepository: ISchoolYearRepository,
  ) { }

  async execute(
    schoolYearId: string,
    schoolId: string,
    input: CreateMonthlyGoalTemplateInput
  ): Promise<Result<Prisma.MonthlyGoalTemplateGetPayload<{}>, DomainError>> {
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

      const template = await this.monthlyGoalRepository.createTemplate(
        schoolYearId,
        schoolId,
        { name: input.name, quarter: input.quarter }
      );

      return Ok(template);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}
