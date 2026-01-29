import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AddNoteToDailyGoalUseCase } from '../../../../core/application/use-cases/daily-goals/AddNoteToDailyGoalUseCase';
import { InvalidEntityError, ObjectNotFoundError } from '../../../../core/domain/errors';
import { createMockDailyGoalRepository } from '../../utils/mockRepositories';

describe('AddNoteToDailyGoalUseCase', () => {
  let dailyGoalRepo: ReturnType<typeof createMockDailyGoalRepository>;
  let useCase: AddNoteToDailyGoalUseCase;

  beforeEach(() => {
    dailyGoalRepo = createMockDailyGoalRepository();
    useCase = new AddNoteToDailyGoalUseCase(dailyGoalRepo);
    vi.clearAllMocks();
  });

  const createMockDailyGoal = (
    id: string,
    notes: string | null = null
  ) => {
    return {
      id: id.startsWith('clh') ? id : 'clh1111111111111111111111',
      subject: 'Math',
      quarter: 'Q1',
      week: 1,
      dayOfWeek: 1,
      text: '1-10',
      isCompleted: false,
      notes,
      notesCompleted: false,
      projectionId: 'clh1111111111111111111111',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  it('adds note successfully', async () => {
    const goalId = 'clh1111111111111111111111';
    const existingGoal = createMockDailyGoal(goalId);
    const updatedGoal = createMockDailyGoal(goalId, 'Missing page 10');

    vi.mocked(dailyGoalRepo.findById).mockResolvedValue(existingGoal as any);
    vi.mocked(dailyGoalRepo.updateNote).mockResolvedValue(updatedGoal as any);

    const result = await useCase.execute(goalId, 'clh3333333333333333333333', {
      notes: 'Missing page 10',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBe('Missing page 10');
    }
    expect(dailyGoalRepo.updateNote).toHaveBeenCalledWith(goalId, 'Missing page 10', 'clh3333333333333333333333');
  });

  it('returns Err when daily goal does not exist', async () => {
    vi.mocked(dailyGoalRepo.findById).mockResolvedValue(null);

    const goalId = 'clh1111111111111111111111';
    const result = await useCase.execute(goalId, 'clh3333333333333333333333', {
      notes: 'Missing page 10',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ObjectNotFoundError);
      expect(result.error.message).toContain('Daily goal with ID');
    }
    expect(dailyGoalRepo.updateNote).not.toHaveBeenCalled();
  });

  it('returns Err when note exceeds 50 characters', async () => {
    const goalId = 'clh1111111111111111111111';
    const existingGoal = createMockDailyGoal(goalId);
    const longNote = 'a'.repeat(51);

    vi.mocked(dailyGoalRepo.findById).mockResolvedValue(existingGoal as any);
    const result = await useCase.execute(goalId, 'clh3333333333333333333333', {
      notes: longNote,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(InvalidEntityError);
      expect(result.error.message).toContain('50 characters');
    }
    expect(dailyGoalRepo.updateNote).not.toHaveBeenCalled();
  });

  it('allows note with exactly 50 characters', async () => {
    const goalId = 'clh1111111111111111111111';
    const existingGoal = createMockDailyGoal(goalId);
    const note50Chars = 'a'.repeat(50);
    const updatedGoal = createMockDailyGoal(goalId, note50Chars);

    vi.mocked(dailyGoalRepo.findById).mockResolvedValue(existingGoal as any);
    vi.mocked(dailyGoalRepo.updateNote).mockResolvedValue(updatedGoal as any);
    const result = await useCase.execute(goalId, 'clh3333333333333333333333', {
      notes: note50Chars,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBe(note50Chars);
    }
  });

  it('returns Err when daily goal belongs to different school (tenant isolation)', async () => {
    vi.mocked(dailyGoalRepo.findById).mockResolvedValue(null); // Repository returns null when schoolId doesn't match

    const goalId = 'clh1111111111111111111111';
    const result = await useCase.execute(goalId, 'clh9999999999999999999999', { // Different schoolId
      notes: 'Missing page 10',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ObjectNotFoundError);
      expect(result.error.message).toContain('Daily goal with ID');
    }
    expect(dailyGoalRepo.findById).toHaveBeenCalledWith(goalId, 'clh9999999999999999999999');
    expect(dailyGoalRepo.updateNote).not.toHaveBeenCalled();
  });
});
