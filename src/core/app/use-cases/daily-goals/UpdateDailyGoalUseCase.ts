import { IDailyGoalRepository } from '../../../adapters_interface/repositories';
import { DailyGoal } from '../../../domain/entities';
import { UpdateDailyGoalInput } from '../../dtos';

export class UpdateDailyGoalUseCase {
  constructor(private dailyGoalRepository: IDailyGoalRepository) {}

  async execute(data: UpdateDailyGoalInput): Promise<DailyGoal> {
    const existingGoal = await this.dailyGoalRepository.findById(data.id);
    if (!existingGoal) {
      throw new Error('Daily goal not found');
    }

    const updatedGoal = existingGoal.update({
      subject: data.subject,
      quarter: data.quarter,
      week: data.week,
      dayOfWeek: data.dayOfWeek,
      text: data.text,
      isCompleted: data.isCompleted,
      notes: data.notes,
      notesCompleted: data.notesCompleted,
    });

    // Validate the goal text format if it's being updated
    if (data.text !== undefined && !updatedGoal.isValidText) {
      throw new Error('Invalid goal text format. Use page ranges (1-1000) or "Self Test"');
    }

    return await this.dailyGoalRepository.update(updatedGoal);
  }
}
