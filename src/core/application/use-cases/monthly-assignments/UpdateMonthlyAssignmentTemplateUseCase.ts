import { IMonthlyAssignmentRepository } from '../../../domain/interfaces/repositories';
import { InvalidEntityError, ObjectNotFoundError, DomainError } from '../../../domain/errors';
import { UpdateMonthlyAssignmentTemplateInput } from '../../dtos/monthly-assignments';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import { Prisma } from '@prisma/client';

export class UpdateMonthlyAssignmentTemplateUseCase {
  constructor(
    private readonly monthlyAssignmentRepository: IMonthlyAssignmentRepository,
  ) { }

  async execute(
    templateId: string,
    schoolId: string,
    input: UpdateMonthlyAssignmentTemplateInput
  ): Promise<Result<Prisma.MonthlyAssignmentTemplateGetPayload<{}>, DomainError>> {
    try {
      validateCuid(templateId, 'MonthlyAssignmentTemplate');
      validateCuid(schoolId, 'School');

      const template = await this.monthlyAssignmentRepository.updateTemplate(
        templateId,
        schoolId,
        { name: input.name }
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
