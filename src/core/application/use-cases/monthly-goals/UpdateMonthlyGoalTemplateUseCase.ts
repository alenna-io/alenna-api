import { IMonthlyGoalRepository } from '../../../domain/interfaces/repositories';
import { InvalidEntityError, ObjectNotFoundError, DomainError } from '../../../domain/errors';
import { UpdateMonthlyGoalTemplateInput } from '../../dtos/monthly-goals';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import { Prisma } from '@prisma/client';

export class UpdateMonthlyGoalTemplateUseCase {
  constructor(
    private readonly monthlyGoalRepository: IMonthlyGoalRepository,
  ) { }

  async execute(
    templateId: string,
    schoolId: string,
    input: UpdateMonthlyGoalTemplateInput
  ): Promise<Result<Prisma.MonthlyGoalTemplateGetPayload<{}>, DomainError>> {
    try {
      validateCuid(templateId, 'MonthlyGoalTemplate');
      validateCuid(schoolId, 'School');

      const template = await this.monthlyGoalRepository.updateTemplate(
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
