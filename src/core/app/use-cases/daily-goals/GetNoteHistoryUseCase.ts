import { IDailyGoalRepository } from '../../../adapters_interface/repositories';
import { NoteHistory } from '../../../domain/entities';

export class GetNoteHistoryUseCase {
  constructor(private dailyGoalRepository: IDailyGoalRepository) {}

  async execute(dailyGoalId: string): Promise<NoteHistory[]> {
    const dailyGoal = await this.dailyGoalRepository.findById(dailyGoalId);
    if (!dailyGoal) {
      throw new Error('Daily goal not found');
    }

    return await this.dailyGoalRepository.getNoteHistoryByDailyGoalId(dailyGoalId);
  }
}
