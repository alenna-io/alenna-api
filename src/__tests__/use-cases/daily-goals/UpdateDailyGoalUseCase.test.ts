import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateDailyGoalUseCase } from '../../../core/app/use-cases/deprecated/daily-goals/UpdateDailyGoalUseCase';
import { createMockDailyGoalRepository } from '../../utils/mockRepositories';
import { createTestDailyGoal, TEST_CONSTANTS } from '../../utils/testHelpers';

describe('UpdateDailyGoalUseCase', () => {
  let useCase: UpdateDailyGoalUseCase;
  let mockRepository: ReturnType<typeof createMockDailyGoalRepository>;

  beforeEach(() => {
    mockRepository = createMockDailyGoalRepository();
    useCase = new UpdateDailyGoalUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should update daily goal successfully', async () => {
      const existingGoal = createTestDailyGoal({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        text: '45-67',
        isCompleted: false,
      });

      const updatedGoal = existingGoal.update({
        text: '68-90',
        isCompleted: true,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(existingGoal);
      vi.mocked(mockRepository.update).mockResolvedValue(updatedGoal);

      const result = await useCase.execute({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        text: '68-90',
        isCompleted: true,
      });

      expect(result.text).toBe('68-90');
      expect(result.isCompleted).toBe(true);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should throw error when daily goal not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(
        useCase.execute({
          id: TEST_CONSTANTS.DAILY_GOAL_ID,
          text: '68-90',
        })
      ).rejects.toThrow('Daily goal not found');
    });

    it('should throw error for invalid text format', async () => {
      const existingGoal = createTestDailyGoal({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        text: '45-67',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(existingGoal);

      await expect(
        useCase.execute({
          id: TEST_CONSTANTS.DAILY_GOAL_ID,
          text: 'invalid',
        })
      ).rejects.toThrow('Invalid goal text format');
    });

    it('should update subject', async () => {
      const existingGoal = createTestDailyGoal({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        subject: 'Math',
      });

      const updatedGoal = existingGoal.update({
        subject: 'English',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(existingGoal);
      vi.mocked(mockRepository.update).mockResolvedValue(updatedGoal);

      const result = await useCase.execute({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        subject: 'English',
      });

      expect(result.subject).toBe('English');
    });

    it('should update quarter and week', async () => {
      const existingGoal = createTestDailyGoal({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        quarter: 'Q1',
        week: 1,
      });

      const updatedGoal = existingGoal.update({
        quarter: 'Q2',
        week: 3,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(existingGoal);
      vi.mocked(mockRepository.update).mockResolvedValue(updatedGoal);

      const result = await useCase.execute({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        quarter: 'Q2',
        week: 3,
      });

      expect(result.quarter).toBe('Q2');
      expect(result.week).toBe(3);
    });

    it('should update dayOfWeek', async () => {
      const existingGoal = createTestDailyGoal({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        dayOfWeek: 1,
      });

      const updatedGoal = existingGoal.update({
        dayOfWeek: 3,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(existingGoal);
      vi.mocked(mockRepository.update).mockResolvedValue(updatedGoal);

      const result = await useCase.execute({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        dayOfWeek: 3,
      });

      expect(result.dayOfWeek).toBe(3);
    });

    it('should update notes and notesCompleted', async () => {
      const existingGoal = createTestDailyGoal({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        notes: 'Old notes',
        notesCompleted: false,
      });

      const updatedGoal = existingGoal.update({
        notes: 'New notes',
        notesCompleted: true,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(existingGoal);
      vi.mocked(mockRepository.update).mockResolvedValue(updatedGoal);

      const result = await useCase.execute({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        notes: 'New notes',
        notesCompleted: true,
      });

      expect(result.notes).toBe('New notes');
      expect(result.notesCompleted).toBe(true);
    });

    it('should allow partial updates', async () => {
      const existingGoal = createTestDailyGoal({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        text: '45-67',
        isCompleted: false,
      });

      const updatedGoal = existingGoal.update({
        isCompleted: true,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(existingGoal);
      vi.mocked(mockRepository.update).mockResolvedValue(updatedGoal);

      const result = await useCase.execute({
        id: TEST_CONSTANTS.DAILY_GOAL_ID,
        isCompleted: true,
      });

      expect(result.text).toBe('45-67');
      expect(result.isCompleted).toBe(true);
    });
  });
});

