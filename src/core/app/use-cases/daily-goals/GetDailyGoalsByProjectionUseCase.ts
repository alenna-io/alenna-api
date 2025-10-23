import { IDailyGoalRepository } from '../../../adapters_interface/repositories';
import { DailyGoal } from '../../../domain/entities';

export class GetDailyGoalsByProjectionUseCase {
  constructor(private dailyGoalRepository: IDailyGoalRepository) {}

  async execute(projectionId: string): Promise<DailyGoal[]> {
    return await this.dailyGoalRepository.findByProjection(projectionId);
  }
}
