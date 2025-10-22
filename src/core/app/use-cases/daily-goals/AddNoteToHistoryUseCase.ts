import { IDailyGoalRepository } from '../../../adapters_interface/repositories';
import { NoteHistory } from '../../../domain/entities';
import { AddNoteToHistoryInput } from '../../dtos';
import { randomUUID } from 'crypto';

export class AddNoteToHistoryUseCase {
  constructor(private dailyGoalRepository: IDailyGoalRepository) {}

  async execute(data: AddNoteToHistoryInput): Promise<NoteHistory> {
    const dailyGoal = await this.dailyGoalRepository.findById(data.dailyGoalId);
    if (!dailyGoal) {
      throw new Error('Daily goal not found');
    }

    const noteHistory = NoteHistory.create({
      id: randomUUID(),
      dailyGoalId: data.dailyGoalId,
      text: data.text,
      completedDate: new Date(),
    });

    return await this.dailyGoalRepository.addNoteToHistory(noteHistory);
  }
}
