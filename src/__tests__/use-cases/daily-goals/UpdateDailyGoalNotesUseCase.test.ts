import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateDailyGoalNotesUseCase } from '../../../core/app/use-cases/deprecated/daily-goals/UpdateDailyGoalNotesUseCase';
import { createMockDailyGoalRepository } from '../../utils/mockRepositories';
import { createTestDailyGoal, TEST_CONSTANTS } from '../../utils/testHelpers';

describe('UpdateDailyGoalNotesUseCase', () => {
  let useCase: UpdateDailyGoalNotesUseCase;
  let mockRepository: ReturnType<typeof createMockDailyGoalRepository>;

  beforeEach(() => {
    mockRepository = createMockDailyGoalRepository();
    useCase = new UpdateDailyGoalNotesUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should update notes successfully', async () => {
      const existingGoal = createTestDailyGoal({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        notes: 'Old notes',
        notesCompleted: false,
      });

      const updatedGoal = existingGoal.updateNotes('New notes', true);

      vi.mocked(mockRepository.findById).mockResolvedValue(existingGoal);
      vi.mocked(mockRepository.updateNotes).mockResolvedValue(updatedGoal);

      const result = await useCase.execute({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        notes: 'New notes',
        notesCompleted: true,
      });

      expect(result.notes).toBe('New notes');
      expect(result.notesCompleted).toBe(true);
      expect(mockRepository.updateNotes).toHaveBeenCalledWith(
        TEST_CONSTANTS.DAILY_GOAL_ID,
        'New notes',
        true
      );
    });

    it('should update notes without changing notesCompleted', async () => {
      const existingGoal = createTestDailyGoal({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        notes: 'Old notes',
        notesCompleted: false,
      });

      const updatedGoal = existingGoal.updateNotes('New notes');

      vi.mocked(mockRepository.findById).mockResolvedValue(existingGoal);
      vi.mocked(mockRepository.updateNotes).mockResolvedValue(updatedGoal);

      const result = await useCase.execute({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        notes: 'New notes',
      });

      expect(result.notes).toBe('New notes');
      expect(mockRepository.updateNotes).toHaveBeenCalledWith(
        TEST_CONSTANTS.DAILY_GOAL_ID,
        'New notes',
        undefined
      );
    });

    it('should update notesCompleted flag only', async () => {
      const existingGoal = createTestDailyGoal({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        notes: 'Existing notes',
        notesCompleted: false,
      });

      const updatedGoal = existingGoal.updateNotes(undefined, true);

      vi.mocked(mockRepository.findById).mockResolvedValue(existingGoal);
      vi.mocked(mockRepository.updateNotes).mockResolvedValue(updatedGoal);

      const result = await useCase.execute({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        notesCompleted: true,
      });

      expect(result.notes).toBe('Existing notes');
      expect(result.notesCompleted).toBe(true);
      expect(mockRepository.updateNotes).toHaveBeenCalledWith(
        TEST_CONSTANTS.DAILY_GOAL_ID,
        undefined,
        true
      );
    });

    it('should clear notes', async () => {
      const existingGoal = createTestDailyGoal({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        notes: 'Old notes',
        notesCompleted: true,
      });

      const updatedGoal = existingGoal.updateNotes('', false);

      vi.mocked(mockRepository.findById).mockResolvedValue(existingGoal);
      vi.mocked(mockRepository.updateNotes).mockResolvedValue(updatedGoal);

      const result = await useCase.execute({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        notes: '',
        notesCompleted: false,
      });

      expect(result.notes).toBe('');
      expect(result.notesCompleted).toBe(false);
    });

    it('should throw error when daily goal not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(
        useCase.execute({
          id: TEST_CONSTANTS.DAILY_GOAL_ID,
          notes: 'New notes',
        })
      ).rejects.toThrow('Daily goal not found');
    });
  });
});

