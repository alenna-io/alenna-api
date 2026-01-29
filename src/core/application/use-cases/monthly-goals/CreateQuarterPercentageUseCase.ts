import { IMonthlyGoalRepository, ISchoolYearRepository } from '../../../domain/interfaces/repositories';
import { InvalidEntityError, ObjectNotFoundError, DomainError } from '../../../domain/errors';
import { CreateQuarterPercentageInput } from '../../dtos/monthly-goals';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import { Prisma } from '@prisma/client';

export class CreateQuarterPercentageUseCase {
  constructor(
    private readonly monthlyGoalRepository: IMonthlyGoalRepository,
    private readonly schoolYearRepository: ISchoolYearRepository,
  ) { }

  async execute(
    schoolYearId: string,
    schoolId: string,
    input: CreateQuarterPercentageInput
  ): Promise<Result<Prisma.QuarterGradePercentageGetPayload<{}>, DomainError>> {
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

      const percentage = await this.monthlyGoalRepository.createPercentage(
        schoolYearId,
        schoolId,
        { quarter: input.quarter, percentage: input.percentage }
      );

      return Ok(percentage);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}
