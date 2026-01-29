import { IDailyGoalRepository } from '../../../domain/interfaces/repositories';
import { InvalidEntityError, ObjectNotFoundError, DomainError } from '../../../domain/errors';
import { AddNoteInput } from '../../dtos/daily-goals/AddNoteInput';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import { Prisma } from '@prisma/client';

export class AddNoteToDailyGoalUseCase {
  constructor(
    private readonly dailyGoalRepository: IDailyGoalRepository,
  ) { }

  async execute(dailyGoalId: string, schoolId: string, input: AddNoteInput): Promise<Result<Prisma.DailyGoalGetPayload<{}>, DomainError>> {
    try {
      validateCuid(dailyGoalId, 'DailyGoal');
      validateCuid(schoolId, 'School');

      const existingGoal = await this.dailyGoalRepository.findById(dailyGoalId, schoolId);

      if (!existingGoal) {
        return Err(new ObjectNotFoundError('DailyGoal', `Daily goal with ID ${dailyGoalId} not found`));
      }

      if (input.notes.length > 50) {
        return Err(new InvalidEntityError('DailyGoal', 'Note must be 50 characters or less'));
      }

      const updatedGoal = await this.dailyGoalRepository.updateNote(dailyGoalId, input.notes, schoolId);
      return Ok(updatedGoal);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}
