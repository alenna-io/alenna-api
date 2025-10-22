import { IDailyGoalRepository } from '../../../adapters_interface/repositories';

export class DeleteDailyGoalUseCase {
  constructor(private dailyGoalRepository: IDailyGoalRepository) {}

  async execute(id: string): Promise<void> {
    const existingGoal = await this.dailyGoalRepository.findById(id);
    if (!existingGoal) {
      throw new Error('Daily goal not found');
    }

    await this.dailyGoalRepository.softDelete(id);
  }
}
