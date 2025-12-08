import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteDailyGoalUseCase } from '../../../core/app/use-cases/daily-goals/DeleteDailyGoalUseCase';
import { createMockDailyGoalRepository } from '../../utils/mockRepositories';
import { createTestDailyGoal, TEST_CONSTANTS } from '../../utils/testHelpers';

describe('DeleteDailyGoalUseCase', () => {
  let useCase: DeleteDailyGoalUseCase;
  let mockRepository: ReturnType<typeof createMockDailyGoalRepository>;

  beforeEach(() => {
    mockRepository = createMockDailyGoalRepository();
    useCase = new DeleteDailyGoalUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should soft delete daily goal successfully', async () => {
      const existingGoal = createTestDailyGoal({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(existingGoal);
      vi.mocked(mockRepository.softDelete).mockResolvedValue();

      await useCase.execute(TEST_CONSTANTS.DAILY_GOAL_ID);

      expect(mockRepository.findById).toHaveBeenCalledWith(TEST_CONSTANTS.DAILY_GOAL_ID);
      expect(mockRepository.softDelete).toHaveBeenCalledWith(TEST_CONSTANTS.DAILY_GOAL_ID);
    });

    it('should throw error when daily goal not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(useCase.execute(TEST_CONSTANTS.DAILY_GOAL_ID)).rejects.toThrow(
        'Daily goal not found'
      );
    });
  });
});

