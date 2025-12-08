import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetDailyGoalsByProjectionUseCase } from '../../../core/app/use-cases/daily-goals/GetDailyGoalsByProjectionUseCase';
import { createMockDailyGoalRepository } from '../../utils/mockRepositories';
import { createTestDailyGoal, TEST_CONSTANTS } from '../../utils/testHelpers';

describe('GetDailyGoalsByProjectionUseCase', () => {
  let useCase: GetDailyGoalsByProjectionUseCase;
  let mockRepository: ReturnType<typeof createMockDailyGoalRepository>;

  beforeEach(() => {
    mockRepository = createMockDailyGoalRepository();
    useCase = new GetDailyGoalsByProjectionUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return all daily goals for projection', async () => {
      const goals = [
        createTestDailyGoal({
          id: 'goal-1',
          quarter: 'Q1',
          week: 1,
        }),
        createTestDailyGoal({
          id: 'goal-2',
          quarter: 'Q1',
          week: 2,
        }),
        createTestDailyGoal({
          id: 'goal-3',
          quarter: 'Q2',
          week: 1,
        }),
      ];

      vi.mocked(mockRepository.findByProjection).mockResolvedValue(goals);

      const result = await useCase.execute(TEST_CONSTANTS.PROJECTION_ID);

      expect(result).toEqual(goals);
      expect(mockRepository.findByProjection).toHaveBeenCalledWith(TEST_CONSTANTS.PROJECTION_ID);
    });

    it('should return empty array when no goals found', async () => {
      vi.mocked(mockRepository.findByProjection).mockResolvedValue([]);

      const result = await useCase.execute(TEST_CONSTANTS.PROJECTION_ID);

      expect(result).toEqual([]);
    });

    it('should return goals across multiple quarters and weeks', async () => {
      const goals = [
        createTestDailyGoal({ id: 'goal-1', quarter: 'Q1', week: 1 }),
        createTestDailyGoal({ id: 'goal-2', quarter: 'Q1', week: 9 }),
        createTestDailyGoal({ id: 'goal-3', quarter: 'Q4', week: 1 }),
        createTestDailyGoal({ id: 'goal-4', quarter: 'Q4', week: 9 }),
      ];

      vi.mocked(mockRepository.findByProjection).mockResolvedValue(goals);

      const result = await useCase.execute(TEST_CONSTANTS.PROJECTION_ID);

      expect(result.length).toBe(4);
      expect(result).toEqual(goals);
    });
  });
});

