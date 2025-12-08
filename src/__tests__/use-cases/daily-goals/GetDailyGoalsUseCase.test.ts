import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetDailyGoalsUseCase } from '../../../core/app/use-cases/daily-goals/GetDailyGoalsUseCase';
import { createMockDailyGoalRepository } from '../../utils/mockRepositories';
import { createTestDailyGoal, TEST_CONSTANTS } from '../../utils/testHelpers';

describe('GetDailyGoalsUseCase', () => {
  let useCase: GetDailyGoalsUseCase;
  let mockRepository: ReturnType<typeof createMockDailyGoalRepository>;

  beforeEach(() => {
    mockRepository = createMockDailyGoalRepository();
    useCase = new GetDailyGoalsUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return daily goals for projection, quarter, and week', async () => {
      const goals = [
        createTestDailyGoal({
          id: 'goal-1',
          subject: 'Math',
          quarter: 'Q1',
          week: 1,
          dayOfWeek: 1,
        }),
        createTestDailyGoal({
          id: 'goal-2',
          subject: 'English',
          quarter: 'Q1',
          week: 1,
          dayOfWeek: 2,
        }),
      ];

      vi.mocked(mockRepository.findByProjectionQuarterWeek).mockResolvedValue(goals);

      const result = await useCase.execute({
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        quarter: 'Q1',
        week: 1,
      });

      expect(result).toEqual(goals);
      expect(mockRepository.findByProjectionQuarterWeek).toHaveBeenCalledWith(
        TEST_CONSTANTS.PROJECTION_ID,
        'Q1',
        1
      );
    });

    it('should return empty array when no goals found', async () => {
      vi.mocked(mockRepository.findByProjectionQuarterWeek).mockResolvedValue([]);

      const result = await useCase.execute({
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        quarter: 'Q1',
        week: 1,
      });

      expect(result).toEqual([]);
    });

    it('should return goals for different quarters', async () => {
      const goals = [
        createTestDailyGoal({
          id: 'goal-1',
          quarter: 'Q2',
          week: 1,
        }),
      ];

      vi.mocked(mockRepository.findByProjectionQuarterWeek).mockResolvedValue(goals);

      const result = await useCase.execute({
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        quarter: 'Q2',
        week: 1,
      });

      expect(result).toEqual(goals);
      expect(mockRepository.findByProjectionQuarterWeek).toHaveBeenCalledWith(
        TEST_CONSTANTS.PROJECTION_ID,
        'Q2',
        1
      );
    });

    it('should return goals for different weeks', async () => {
      const goals = [
        createTestDailyGoal({
          id: 'goal-1',
          quarter: 'Q1',
          week: 5,
        }),
      ];

      vi.mocked(mockRepository.findByProjectionQuarterWeek).mockResolvedValue(goals);

      const result = await useCase.execute({
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        quarter: 'Q1',
        week: 5,
      });

      expect(result).toEqual(goals);
      expect(mockRepository.findByProjectionQuarterWeek).toHaveBeenCalledWith(
        TEST_CONSTANTS.PROJECTION_ID,
        'Q1',
        5
      );
    });
  });
});

