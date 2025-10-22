import { IDailyGoalRepository } from '../../../adapters_interface/repositories';
import { DailyGoal } from '../../../domain/entities';
import { GetDailyGoalsInput } from '../../dtos';

export class GetDailyGoalsUseCase {
  constructor(private dailyGoalRepository: IDailyGoalRepository) {}

  async execute(data: GetDailyGoalsInput): Promise<DailyGoal[]> {
    return await this.dailyGoalRepository.findByProjectionQuarterWeek(
      data.projectionId,
      data.quarter,
      data.week
    );
  }
}
