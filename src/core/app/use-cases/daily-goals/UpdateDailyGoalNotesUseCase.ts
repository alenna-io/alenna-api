import { IDailyGoalRepository } from '../../../adapters_interface/repositories';
import { DailyGoal } from '../../../domain/entities';
import { UpdateDailyGoalNotesInput } from '../../dtos';

export class UpdateDailyGoalNotesUseCase {
  constructor(private dailyGoalRepository: IDailyGoalRepository) {}

  async execute(data: UpdateDailyGoalNotesInput): Promise<DailyGoal> {
    const existingGoal = await this.dailyGoalRepository.findById(data.id);
    if (!existingGoal) {
      throw new Error('Daily goal not found');
    }

    return await this.dailyGoalRepository.updateNotes(data.id, data.notes, data.notesCompleted);
  }
}
