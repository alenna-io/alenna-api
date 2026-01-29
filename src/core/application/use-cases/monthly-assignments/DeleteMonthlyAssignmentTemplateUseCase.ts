import { IMonthlyAssignmentRepository } from '../../../domain/interfaces/repositories';
import { InvalidEntityError, ObjectNotFoundError, DomainError } from '../../../domain/errors';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';

export class DeleteMonthlyAssignmentTemplateUseCase {
  constructor(
    private readonly monthlyAssignmentRepository: IMonthlyAssignmentRepository,
  ) { }

  async execute(templateId: string, schoolId: string): Promise<Result<void, DomainError>> {
    try {
      validateCuid(templateId, 'MonthlyAssignmentTemplate');
      validateCuid(schoolId, 'School');

      await this.monthlyAssignmentRepository.deleteTemplate(templateId, schoolId);
      return Ok(undefined);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}
