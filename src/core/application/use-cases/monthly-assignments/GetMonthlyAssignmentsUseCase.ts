import { IMonthlyAssignmentRepository } from '../../../domain/interfaces/repositories';
import { DomainError, InvalidEntityError } from '../../../domain/errors';
import { GetMonthlyAssignmentsOutput } from '../../dtos/monthly-assignments';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';

export class GetMonthlyAssignmentsUseCase {
  constructor(
    private readonly monthlyAssignmentRepository: IMonthlyAssignmentRepository,
  ) { }

  async execute(schoolYearId: string): Promise<Result<GetMonthlyAssignmentsOutput, DomainError>> {
    try {
      validateCuid(schoolYearId, 'SchoolYear');

      const [templates, percentages] = await Promise.all([
        this.monthlyAssignmentRepository.findTemplatesBySchoolYear(schoolYearId),
        this.monthlyAssignmentRepository.findPercentagesBySchoolYear(schoolYearId),
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
