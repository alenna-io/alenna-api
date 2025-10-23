import { IDailyGoalRepository } from '../../../adapters_interface/repositories';
import { DailyGoal } from '../../../domain/entities';
import { UpdateDailyGoalCompletionInput } from '../../dtos';

export class UpdateDailyGoalCompletionUseCase {
  constructor(private dailyGoalRepository: IDailyGoalRepository) {}

  async execute(data: UpdateDailyGoalCompletionInput): Promise<DailyGoal> {
    const existingGoal = await this.dailyGoalRepository.findById(data.id);
    if (!existingGoal) {
      throw new Error('Daily goal not found');
    }

    return await this.dailyGoalRepository.updateCompletionStatus(data.id, data.isCompleted);
  }
}
