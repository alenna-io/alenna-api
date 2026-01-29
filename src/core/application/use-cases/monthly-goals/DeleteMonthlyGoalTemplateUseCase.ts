import { IMonthlyGoalRepository } from '../../../domain/interfaces/repositories';
import { InvalidEntityError, ObjectNotFoundError, DomainError } from '../../../domain/errors';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';

export class DeleteMonthlyGoalTemplateUseCase {
  constructor(
    private readonly monthlyGoalRepository: IMonthlyGoalRepository,
  ) { }

  async execute(templateId: string, schoolId: string): Promise<Result<void, DomainError>> {
    try {
      validateCuid(templateId, 'MonthlyGoalTemplate');
      validateCuid(schoolId, 'School');

      await this.monthlyGoalRepository.deleteTemplate(templateId, schoolId);
      return Ok(undefined);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}
