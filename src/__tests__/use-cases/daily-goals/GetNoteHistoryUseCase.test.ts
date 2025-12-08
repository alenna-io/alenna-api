import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetNoteHistoryUseCase } from '../../../core/app/use-cases/daily-goals/GetNoteHistoryUseCase';
import { createMockDailyGoalRepository } from '../../utils/mockRepositories';
import { createTestDailyGoal, TEST_CONSTANTS } from '../../utils/testHelpers';
import { NoteHistory } from '../../../core/domain/entities';

describe('GetNoteHistoryUseCase', () => {
  let useCase: GetNoteHistoryUseCase;
  let mockRepository: ReturnType<typeof createMockDailyGoalRepository>;

  beforeEach(() => {
    mockRepository = createMockDailyGoalRepository();
    useCase = new GetNoteHistoryUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return note history for daily goal', async () => {
      const existingGoal = createTestDailyGoal({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
      });

      const noteHistory = [
        NoteHistory.create({
          id: 'note-history-1',
          dailyGoalId: TEST_CONSTANTS.DAILY_GOAL_ID,
          text: 'First note',
          completedDate: new Date('2024-01-15'),
        }),
        NoteHistory.create({
          id: 'note-history-2',
          dailyGoalId: TEST_CONSTANTS.DAILY_GOAL_ID,
          text: 'Second note',
          completedDate: new Date('2024-01-16'),
        }),
      ];

      vi.mocked(mockRepository.findById).mockResolvedValue(existingGoal);
      vi.mocked(mockRepository.getNoteHistoryByDailyGoalId).mockResolvedValue(noteHistory);

      const result = await useCase.execute(TEST_CONSTANTS.DAILY_GOAL_ID);

      expect(result).toEqual(noteHistory);
      expect(result.length).toBe(2);
      expect(mockRepository.getNoteHistoryByDailyGoalId).toHaveBeenCalledWith(
        TEST_CONSTANTS.DAILY_GOAL_ID
      );
    });

    it('should return empty array when no history exists', async () => {
      const existingGoal = createTestDailyGoal({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(existingGoal);
      vi.mocked(mockRepository.getNoteHistoryByDailyGoalId).mockResolvedValue([]);

      const result = await useCase.execute(TEST_CONSTANTS.DAILY_GOAL_ID);

      expect(result).toEqual([]);
    });

    it('should throw error when daily goal not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(useCase.execute(TEST_CONSTANTS.DAILY_GOAL_ID)).rejects.toThrow(
        'Daily goal not found'
      );
    });
  });
});

