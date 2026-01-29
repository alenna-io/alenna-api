import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateDailyGoalUseCase } from '../../../../core/application/use-cases/daily-goals/CreateDailyGoalUseCase';
import { InvalidEntityError, ObjectNotFoundError } from '../../../../core/domain/errors';
import { createMockProjectionRepository, createMockDailyGoalRepository } from '../../utils/mockRepositories';
import { ProjectionStatus, UserStatus } from '@prisma/client';
import { ProjectionWithDetails } from '../../../../core/infrastructure/repositories/types/projections.types';

describe('CreateDailyGoalUseCase', () => {
  let projectionRepo: ReturnType<typeof createMockProjectionRepository>;
  let dailyGoalRepo: ReturnType<typeof createMockDailyGoalRepository>;
  let useCase: CreateDailyGoalUseCase;

  beforeEach(() => {
    projectionRepo = createMockProjectionRepository();
    dailyGoalRepo = createMockDailyGoalRepository();
    useCase = new CreateDailyGoalUseCase(projectionRepo, dailyGoalRepo);
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
      student: {
        id: 'clh2222222222222222222222',
        userId: 'clh5555555555555555555555',
        schoolId: 'clh3333333333333333333333',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        user: {
          id: 'clh5555555555555555555555',
          schoolId: 'clh3333333333333333333333',
          status: UserStatus.ACTIVE,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          phone: null,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          createdPassword: true,
        },
      },
      projectionPaces: [],
      dailyGoals: [],
      ...overrides,
    } as ProjectionWithDetails;
  };

  const createMockDailyGoal = (
    id: string,
    subject: string,
    quarter: string,
    week: number,
    dayOfWeek: number,
    text: string
  ) => {
    return {
      id,
      subject,
      quarter,
      week,
      dayOfWeek,
      text,
      isCompleted: false,
      notes: null,
      notesCompleted: false,
      projectionId: 'clh1111111111111111111111',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  it('creates daily goal successfully', async () => {
    const projection = createMockProjection();
    const dailyGoal = createMockDailyGoal('goal1', 'Math', 'Q1', 1, 1, '1-10');

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(dailyGoalRepo.create).mockResolvedValue(dailyGoal);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
      subject: 'Math',
      quarter: 'Q1',
      week: 1,
      dayOfWeek: 1,
      text: '1-10',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.text).toBe('1-10');
      expect(result.data.subject).toBe('Math');
      expect(result.data.isCompleted).toBe(false);
    }
    expect(dailyGoalRepo.create).toHaveBeenCalledWith(
      'clh1111111111111111111111',
      'Math',
      'Q1',
      1,
      1,
      '1-10'
    );
  });

  it('returns Err when projection does not exist', async () => {
    vi.mocked(projectionRepo.findById).mockResolvedValue(null);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
      subject: 'Math',
      quarter: 'Q1',
      week: 1,
      dayOfWeek: 1,
      text: '1-10',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ObjectNotFoundError);
      expect(result.error.message).toContain('Projection with ID');
    }
    expect(dailyGoalRepo.create).not.toHaveBeenCalled();
  });

  it('returns Err when projection is closed', async () => {
    const projection = createMockProjection({ status: ProjectionStatus.CLOSED });

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
      subject: 'Math',
      quarter: 'Q1',
      week: 1,
      dayOfWeek: 1,
      text: '1-10',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(InvalidEntityError);
      expect(result.error.message).toContain('Cannot edit closed projection');
    }
    expect(dailyGoalRepo.create).not.toHaveBeenCalled();
  });

  it('creates daily goal with single number', async () => {
    const projection = createMockProjection();
    const dailyGoal = createMockDailyGoal('goal1', 'Math', 'Q1', 1, 1, '5');

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(dailyGoalRepo.create).mockResolvedValue(dailyGoal);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
      subject: 'Math',
      quarter: 'Q1',
      week: 1,
      dayOfWeek: 1,
      text: '5',
    });

    expect(result.success).toBe(true);
  });

  it('creates daily goal with special word', async () => {
    const projection = createMockProjection();
    const dailyGoal = createMockDailyGoal('goal1', 'Math', 'Q1', 1, 1, 'ST');

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(dailyGoalRepo.create).mockResolvedValue(dailyGoal);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
      subject: 'Math',
      quarter: 'Q1',
      week: 1,
      dayOfWeek: 1,
      text: 'ST',
    });

    expect(result.success).toBe(true);
  });
});
