import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateDailyGoalUseCase } from '../../../core/app/use-cases/deprecated/daily-goals/CreateDailyGoalUseCase';
import { createMockDailyGoalRepository } from '../../utils/mockRepositories';
import { createTestDailyGoal, TEST_CONSTANTS } from '../../utils/testHelpers';

describe('CreateDailyGoalUseCase', () => {
  let useCase: CreateDailyGoalUseCase;
  let mockRepository: ReturnType<typeof createMockDailyGoalRepository>;

  beforeEach(() => {
    mockRepository = createMockDailyGoalRepository();
    useCase = new CreateDailyGoalUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should create daily goal successfully with page range', async () => {
      const input = {
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        subject: 'Math',
        quarter: 'Q1',
        week: 1,
        dayOfWeek: 1,
        text: '45-67',
        isCompleted: false,
        notesCompleted: false,
      };

      const createdGoal = createTestDailyGoal(input);
      vi.mocked(mockRepository.create).mockResolvedValue(createdGoal);

      const result = await useCase.execute(input);

      expect(result.id).toBe(createdGoal.id);
      expect(result.text).toBe('45-67');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          projectionId: TEST_CONSTANTS.PROJECTION_ID,
          subject: 'Math',
          quarter: 'Q1',
          week: 1,
          dayOfWeek: 1,
          text: '45-67',
        })
      );
    });

    it('should create daily goal with single page', async () => {
      const input = {
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        subject: 'English',
        quarter: 'Q1',
        week: 1,
        dayOfWeek: 2,
        text: '100',
        isCompleted: false,
        notesCompleted: false,
      };

      const createdGoal = createTestDailyGoal(input);
      vi.mocked(mockRepository.create).mockResolvedValue(createdGoal);

      const result = await useCase.execute(input);

      expect(result.text).toBe('100');
    });

    it('should create daily goal with ST (Self Test)', async () => {
      const input = {
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        subject: 'Science',
        quarter: 'Q1',
        week: 1,
        dayOfWeek: 3,
        text: 'ST',
        isCompleted: false,
        notesCompleted: false,
      };

      const createdGoal = createTestDailyGoal(input);
      vi.mocked(mockRepository.create).mockResolvedValue(createdGoal);

      const result = await useCase.execute(input);

      expect(result.text).toBe('ST');
    });

    it('should create daily goal with T (Test)', async () => {
      const input = {
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        subject: 'Social Studies',
        quarter: 'Q1',
        week: 1,
        dayOfWeek: 4,
        text: 'T',
        isCompleted: false,
        notesCompleted: false,
      };

      const createdGoal = createTestDailyGoal(input);
      vi.mocked(mockRepository.create).mockResolvedValue(createdGoal);

      const result = await useCase.execute(input);

      expect(result.text).toBe('T');
    });

    it('should create daily goal with empty text', async () => {
      const input = {
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        subject: 'Word Building',
        quarter: 'Q1',
        week: 1,
        dayOfWeek: 5,
        text: '',
        isCompleted: false,
        notesCompleted: false,
      };

      const createdGoal = createTestDailyGoal(input);
      vi.mocked(mockRepository.create).mockResolvedValue(createdGoal);

      const result = await useCase.execute(input);

      expect(result.text).toBe('');
    });

    it('should throw error for invalid text format', async () => {
      const input = {
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        subject: 'Math',
        quarter: 'Q1',
        week: 1,
        dayOfWeek: 1,
        text: 'invalid',
        isCompleted: false,
        notesCompleted: false,
      };

      await expect(useCase.execute(input)).rejects.toThrow('Invalid goal text format');
    });

    it('should throw error for invalid page range (start > end)', async () => {
      const input = {
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        subject: 'Math',
        quarter: 'Q1',
        week: 1,
        dayOfWeek: 1,
        text: '100-50',
        isCompleted: false,
        notesCompleted: false,
      };

      await expect(useCase.execute(input)).rejects.toThrow('Invalid goal text format');
    });

    it('should throw error for page number > 1000', async () => {
      const input = {
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        subject: 'Math',
        quarter: 'Q1',
        week: 1,
        dayOfWeek: 1,
        text: '1001',
        isCompleted: false,
        notesCompleted: false,
      };

      await expect(useCase.execute(input)).rejects.toThrow('Invalid goal text format');
    });

    it('should create daily goal with notes', async () => {
      const input = {
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        subject: 'Spanish',
        quarter: 'Q1',
        week: 1,
        dayOfWeek: 1,
        text: '50-60',
        notes: 'Review pages carefully',
        isCompleted: false,
        notesCompleted: false,
      };

      const createdGoal = createTestDailyGoal({
        ...input,
        notes: 'Review pages carefully',
        notesCompleted: false,
      });
      vi.mocked(mockRepository.create).mockResolvedValue(createdGoal);

      const result = await useCase.execute(input);

      expect(result.notes).toBe('Review pages carefully');
      expect(result.notesCompleted).toBe(false);
    });

    it('should create daily goal with isCompleted flag', async () => {
      const input = {
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        subject: 'Math',
        quarter: 'Q1',
        week: 1,
        dayOfWeek: 1,
        text: '45-67',
        isCompleted: true,
        notesCompleted: false,
      };

      const createdGoal = createTestDailyGoal({
        ...input,
        isCompleted: true,
      });
      vi.mocked(mockRepository.create).mockResolvedValue(createdGoal);

      const result = await useCase.execute(input);

      expect(result.isCompleted).toBe(true);
    });
  });
});

