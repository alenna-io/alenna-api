import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetDailyGoalsUseCase } from '../../../../core/application/use-cases/projections/GetDailyGoalsUseCase';
import { ObjectNotFoundError } from '../../../../core/domain/errors';
import { createMockProjectionRepository, createMockDailyGoalRepository } from '../../utils/mockRepositories';
import { ProjectionStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

type ProjectionWithDetails = Prisma.ProjectionGetPayload<{
  include: {
    projectionPaces: {
      include: {
        paceCatalog: {
          include: {
            subject: {
              include: {
                category: true;
              };
            };
          };
        };
      };
    };
  };
}>;

describe('GetDailyGoalsUseCase', () => {
  let projectionRepo: ReturnType<typeof createMockProjectionRepository>;
  let dailyGoalRepo: ReturnType<typeof createMockDailyGoalRepository>;
  let useCase: GetDailyGoalsUseCase;

  beforeEach(() => {
    projectionRepo = createMockProjectionRepository();
    dailyGoalRepo = createMockDailyGoalRepository();
    useCase = new GetDailyGoalsUseCase(projectionRepo, dailyGoalRepo);
  });

  const createMockProjection = (overrides?: Partial<ProjectionWithDetails>): ProjectionWithDetails => {
    return {
      id: 'clh1111111111111111111111',
      studentId: 'clh2222222222222222222222',
      schoolId: 'clh3333333333333333333333',
      schoolYear: 'clh4444444444444444444444',
      status: ProjectionStatus.OPEN,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      projectionPaces: [],
      ...overrides,
    } as ProjectionWithDetails;
  };

  const createMockDailyGoal = (
    id: string,
    subject: string,
    quarter: string,
    week: number,
    dayOfWeek: number,
    text: string,
    isCompleted: boolean = false,
    notes: string | null = null,
    notesCompleted: boolean = false
  ) => {
    return {
      id,
      subject,
      quarter,
      week,
      dayOfWeek,
      text,
      isCompleted,
      notes,
      notesCompleted,
      projectionId: 'clh1111111111111111111111',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  it('returns daily goals successfully', async () => {
    const projection = createMockProjection();
    const dailyGoals = [
      createMockDailyGoal('goal1', 'Math', 'Q1', 1, 1, 'Complete lesson 1001'),
      createMockDailyGoal('goal2', 'Math', 'Q1', 1, 2, 'Complete lesson 1002'),
      createMockDailyGoal('goal3', 'English', 'Q1', 1, 1, 'Read chapter 1'),
    ];

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(dailyGoalRepo.findDailyGoalsByWeek).mockResolvedValue(dailyGoals);

    const result = await useCase.execute('clh1111111111111111111111', {
      quarter: 'Q1',
      week: 1,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(3);
      expect(result.data[0].subject).toBe('Math');
      expect(result.data[0].dayOfWeek).toBe(1);
      expect(result.data[0].text).toBe('Complete lesson 1001');
    }
    expect(dailyGoalRepo.findDailyGoalsByWeek).toHaveBeenCalledWith('clh1111111111111111111111', 'Q1', 1);
  });

  it('returns empty array when no goals found', async () => {
    const projection = createMockProjection();

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(dailyGoalRepo.findDailyGoalsByWeek).mockResolvedValue([]);

    const result = await useCase.execute('clh1111111111111111111111', {
      quarter: 'Q1',
      week: 1,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });

  it('returns Err when projection does not exist', async () => {
    vi.mocked(projectionRepo.findById).mockResolvedValue(null);

    const result = await useCase.execute('clh1111111111111111111111', {
      quarter: 'Q1',
      week: 1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ObjectNotFoundError);
      expect(result.error.message).toContain('Projection with ID');
    }
    expect(dailyGoalRepo.findDailyGoalsByWeek).not.toHaveBeenCalled();
  });

  it('handles different quarters and weeks', async () => {
    const projection = createMockProjection();
    const dailyGoals = [
      createMockDailyGoal('goal1', 'Math', 'Q2', 3, 1, 'Complete lesson 1005'),
    ];

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(dailyGoalRepo.findDailyGoalsByWeek).mockResolvedValue(dailyGoals);

    const result = await useCase.execute('clh1111111111111111111111', {
      quarter: 'Q2',
      week: 3,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].quarter).toBe('Q2');
      expect(result.data[0].week).toBe(3);
    }
    expect(dailyGoalRepo.findDailyGoalsByWeek).toHaveBeenCalledWith('clh1111111111111111111111', 'Q2', 3);
  });

  it('includes notes and completion status', async () => {
    const projection = createMockProjection();
    const dailyGoals = [
      createMockDailyGoal('goal1', 'Math', 'Q1', 1, 1, 'Complete lesson 1001', true, 'Finished early', true),
    ];

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(dailyGoalRepo.findDailyGoalsByWeek).mockResolvedValue(dailyGoals);

    const result = await useCase.execute('clh1111111111111111111111', {
      quarter: 'Q1',
      week: 1,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].isCompleted).toBe(true);
      expect(result.data[0].notes).toBe('Finished early');
      expect(result.data[0].notesCompleted).toBe(true);
    }
  });
});
