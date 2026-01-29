import { IMonthlyGoalRepository } from '../../../domain/interfaces/repositories';
import { DomainError, InvalidEntityError } from '../../../domain/errors';
import { GetMonthlyGoalsOutput } from '../../dtos/monthly-goals';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';

export class GetMonthlyGoalsUseCase {
  constructor(
    private readonly monthlyGoalRepository: IMonthlyGoalRepository,
  ) { }

  async execute(schoolYearId: string): Promise<Result<GetMonthlyGoalsOutput, DomainError>> {
    try {
      validateCuid(schoolYearId, 'SchoolYear');

      const [templates, percentages] = await Promise.all([
        this.monthlyGoalRepository.findTemplatesBySchoolYear(schoolYearId),
        this.monthlyGoalRepository.findPercentagesBySchoolYear(schoolYearId),
      ]);

      return Ok({ templates, percentages });
    } catch (error) {
      if (error instanceof InvalidEntityError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}
