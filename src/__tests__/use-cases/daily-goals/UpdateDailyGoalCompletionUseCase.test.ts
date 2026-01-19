import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateDailyGoalCompletionUseCase } from '../../../core/app/use-cases/deprecated/daily-goals/UpdateDailyGoalCompletionUseCase';
import { createMockDailyGoalRepository } from '../../utils/mockRepositories';
import { createTestDailyGoal, TEST_CONSTANTS } from '../../utils/testHelpers';

describe('UpdateDailyGoalCompletionUseCase', () => {
  let useCase: UpdateDailyGoalCompletionUseCase;
  let mockRepository: ReturnType<typeof createMockDailyGoalRepository>;

  beforeEach(() => {
    mockRepository = createMockDailyGoalRepository();
    useCase = new UpdateDailyGoalCompletionUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should mark goal as completed', async () => {
      const existingGoal = createTestDailyGoal({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        isCompleted: false,
      });

      const completedGoal = existingGoal.markCompleted();

      vi.mocked(mockRepository.findById).mockResolvedValue(existingGoal);
      vi.mocked(mockRepository.updateCompletionStatus).mockResolvedValue(completedGoal);

      const result = await useCase.execute({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        isCompleted: true,
      });

      expect(result.isCompleted).toBe(true);
      expect(mockRepository.updateCompletionStatus).toHaveBeenCalledWith(
        TEST_CONSTANTS.DAILY_GOAL_ID,
        true
      );
    });

    it('should mark goal as incomplete', async () => {
      const existingGoal = createTestDailyGoal({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        isCompleted: true,
      });

      const incompleteGoal = existingGoal.markIncomplete();

      vi.mocked(mockRepository.findById).mockResolvedValue(existingGoal);
      vi.mocked(mockRepository.updateCompletionStatus).mockResolvedValue(incompleteGoal);

      const result = await useCase.execute({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        isCompleted: false,
      });

      expect(result.isCompleted).toBe(false);
      expect(mockRepository.updateCompletionStatus).toHaveBeenCalledWith(
        TEST_CONSTANTS.DAILY_GOAL_ID,
        false
      );
    });

    it('should throw error when daily goal not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(
        useCase.execute({
          id: TEST_CONSTANTS.DAILY_GOAL_ID,
          isCompleted: true,
        })
      ).rejects.toThrow('Daily goal not found');
    });
  });
});

