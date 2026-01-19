import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddNoteToHistoryUseCase } from '../../../core/app/use-cases/deprecated/daily-goals/AddNoteToHistoryUseCase';
import { createMockDailyGoalRepository } from '../../utils/mockRepositories';
import { createTestDailyGoal, TEST_CONSTANTS } from '../../utils/testHelpers';
import { NoteHistory } from '../../../core/domain/entities/deprecated';

describe('AddNoteToHistoryUseCase', () => {
  let useCase: AddNoteToHistoryUseCase;
  let mockRepository: ReturnType<typeof createMockDailyGoalRepository>;

  beforeEach(() => {
    mockRepository = createMockDailyGoalRepository();
    useCase = new AddNoteToHistoryUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should add note to history successfully', async () => {
      const existingGoal = createTestDailyGoal({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
      });

      const noteHistory = NoteHistory.create({
        id: 'note-history-1',
        dailyGoalId: TEST_CONSTANTS.DAILY_GOAL_ID,
        text: 'Student completed pages 45-50',
        completedDate: new Date(),
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(existingGoal);
      vi.mocked(mockRepository.addNoteToHistory).mockResolvedValue(noteHistory);

      const result = await useCase.execute({
        dailyGoalId: TEST_CONSTANTS.DAILY_GOAL_ID,
        text: 'Student completed pages 45-50',
      });

      expect(result.id).toBe('note-history-1');
      expect(result.text).toBe('Student completed pages 45-50');
      expect(result.dailyGoalId).toBe(TEST_CONSTANTS.DAILY_GOAL_ID);
      expect(mockRepository.addNoteToHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          dailyGoalId: TEST_CONSTANTS.DAILY_GOAL_ID,
          text: 'Student completed pages 45-50',
        })
      );
    });

    it('should throw error when daily goal not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(
        useCase.execute({
          dailyGoalId: TEST_CONSTANTS.DAILY_GOAL_ID,
          text: 'Some note',
        })
      ).rejects.toThrow('Daily goal not found');
    });

    it('should create note history with completed date', async () => {
      const existingGoal = createTestDailyGoal({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
      });

      const completedDate = new Date('2024-01-15');
      const noteHistory = NoteHistory.create({
        id: 'note-history-1',
        dailyGoalId: TEST_CONSTANTS.DAILY_GOAL_ID,
        text: 'Note text',
        completedDate,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(existingGoal);
      vi.mocked(mockRepository.addNoteToHistory).mockResolvedValue(noteHistory);

      const result = await useCase.execute({
        dailyGoalId: TEST_CONSTANTS.DAILY_GOAL_ID,
        text: 'Note text',
      });

      expect(result.completedDate).toBeInstanceOf(Date);
    });
  });
});

