import { IDailyGoalRepository } from '../../../adapters_interface/repositories';
import { DailyGoal } from '../../../domain/entities';
import { CreateDailyGoalInput } from '../../dtos';
import { randomUUID } from 'crypto';

export class CreateDailyGoalUseCase {
  constructor(private dailyGoalRepository: IDailyGoalRepository) {}

  async execute(data: CreateDailyGoalInput): Promise<DailyGoal> {
    const dailyGoal = DailyGoal.create({
      id: randomUUID(),
      projectionId: data.projectionId,
      subject: data.subject,
      quarter: data.quarter,
      week: data.week,
      dayOfWeek: data.dayOfWeek,
      text: data.text,
      isCompleted: data.isCompleted,
      notes: data.notes,
      notesCompleted: data.notesCompleted,
    });

    // Validate the goal text format
    if (!dailyGoal.isValidText) {
      throw new Error('Invalid goal text format. Use page ranges (1-1000), ST, or T');
    }

    return await this.dailyGoalRepository.create(dailyGoal);
  }
}
