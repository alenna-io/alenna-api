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

      const hasGrades = await this.monthlyAssignmentRepository.hasTemplateAssignmentsWithGrades(templateId);
      if (hasGrades) {
        return Err(new InvalidEntityError(
          'MonthlyAssignmentTemplate',
          'Cannot delete monthly assignment template: there are assignments with grades assigned to this template'
        ));
      }

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
