import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarkDailyGoalCompleteUseCase } from '../../../../core/application/use-cases/daily-goals/MarkDailyGoalCompleteUseCase';
import { ObjectNotFoundError } from '../../../../core/domain/errors';
import { createMockDailyGoalRepository } from '../../utils/mockRepositories';

describe('MarkDailyGoalCompleteUseCase', () => {
  let dailyGoalRepo: ReturnType<typeof createMockDailyGoalRepository>;
  let useCase: MarkDailyGoalCompleteUseCase;

  beforeEach(() => {
    dailyGoalRepo = createMockDailyGoalRepository();
    useCase = new MarkDailyGoalCompleteUseCase(dailyGoalRepo);
    vi.clearAllMocks();
  });

  const createMockDailyGoal = (
    id: string,
    isCompleted: boolean = false,
    notes: string | null = null
  ) => {
    return {
      id: id.startsWith('clh') ? id : 'clh1111111111111111111111',
      subject: 'Math',
      quarter: 'Q1',
      week: 1,
      dayOfWeek: 1,
      text: '1-10',
      isCompleted,
      notes,
      notesCompleted: false,
      projectionId: 'clh1111111111111111111111',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  it('marks daily goal as complete successfully', async () => {
    const goalId = 'clh1111111111111111111111';
    const existingGoal = createMockDailyGoal(goalId, false, 'Missing page 10');
    const updatedGoal = createMockDailyGoal(goalId, true, 'Missing page 10');
    updatedGoal.notesCompleted = true;

    vi.mocked(dailyGoalRepo.findById).mockResolvedValue(existingGoal as any);
    vi.mocked(dailyGoalRepo.markComplete).mockResolvedValue(updatedGoal as any);
    const result = await useCase.execute(goalId, 'clh3333333333333333333333', {
      isCompleted: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isCompleted).toBe(true);
      expect(result.data.notesCompleted).toBe(true);
    }
    expect(dailyGoalRepo.markComplete).toHaveBeenCalledWith(goalId, true, 'clh3333333333333333333333');
  });

  it('marks daily goal as incomplete successfully', async () => {
    const goalId = 'clh1111111111111111111111';
    const existingGoal = createMockDailyGoal(goalId, true, 'Missing page 10');
    const updatedGoal = createMockDailyGoal(goalId, false, 'Missing page 10');
    updatedGoal.notesCompleted = false;

    vi.mocked(dailyGoalRepo.findById).mockResolvedValue(existingGoal as any);
    vi.mocked(dailyGoalRepo.markComplete).mockResolvedValue(updatedGoal as any);
    const result = await useCase.execute(goalId, 'clh3333333333333333333333', {
      isCompleted: false,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isCompleted).toBe(false);
      expect(result.data.notesCompleted).toBe(false);
    }
    expect(dailyGoalRepo.markComplete).toHaveBeenCalledWith(goalId, false, 'clh3333333333333333333333');
  });

  it('returns Err when daily goal does not exist', async () => {
    vi.mocked(dailyGoalRepo.findById).mockResolvedValue(null);

    const goalId = 'clh1111111111111111111111';
    const result = await useCase.execute(goalId, 'clh3333333333333333333333', {
      isCompleted: true,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ObjectNotFoundError);
      expect(result.error.message).toContain('Daily goal with ID');
    }
    expect(dailyGoalRepo.markComplete).not.toHaveBeenCalled();
  });

  it('returns Err when daily goal belongs to different school (tenant isolation)', async () => {
    vi.mocked(dailyGoalRepo.findById).mockResolvedValue(null); // Repository returns null when schoolId doesn't match

    const goalId = 'clh1111111111111111111111';
    const result = await useCase.execute(goalId, 'clh9999999999999999999999', { // Different schoolId
      isCompleted: true,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ObjectNotFoundError);
      expect(result.error.message).toContain('Daily goal with ID');
    }
    expect(dailyGoalRepo.findById).toHaveBeenCalledWith(goalId, 'clh9999999999999999999999');
    expect(dailyGoalRepo.markComplete).not.toHaveBeenCalled();
  });
});
