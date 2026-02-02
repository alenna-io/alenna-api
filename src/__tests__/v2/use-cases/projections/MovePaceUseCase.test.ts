import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MovePaceUseCase } from '../../../../core/application/use-cases/projections/MovePaceUseCase';
import { InvalidEntityError, ObjectNotFoundError } from '../../../../core/domain/errors';
import { createMockProjectionRepository } from '../../utils/mockRepositories';
import { ProjectionStatus, ProjectionPaceStatus } from '@prisma/client';
import { ProjectionWithDetails } from '../../../../core/infrastructure/repositories/types/projections.types';

describe('MovePaceUseCase', () => {
  let projectionRepo: ReturnType<typeof createMockProjectionRepository>;
  let useCase: MovePaceUseCase;

  beforeEach(() => {
    projectionRepo = createMockProjectionRepository();
    useCase = new MovePaceUseCase(projectionRepo);
  });

  const createMockProjection = (overrides?: Partial<ProjectionWithDetails>): ProjectionWithDetails => {
    const base: ProjectionWithDetails = {
      id: 'clh1111111111111111111111',
      studentId: 'clh2222222222222222222222',
      schoolId: 'clh3333333333333333333333',
      schoolYear: 'clh4444444444444444444444',
      status: ProjectionStatus.OPEN,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      projectionPaces: [],
      projectionSubjects: [],
      student: {
        id: 'clh2222222222222222222222',
        userId: 'clh7777777777777777777777',
        schoolId: 'clh3333333333333333333333',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'clh7777777777777777777777',
          clerkId: null,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          phone: null,
          streetAddress: null,
          city: null,
          state: null,
          country: null,
          zipCode: null,
          schoolId: 'clh3333333333333333333333',
          status: 'ACTIVE',
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          language: 'es',
          createdPassword: false,
        },
      },
      dailyGoals: [],
    };
    return { ...base, ...overrides } as ProjectionWithDetails;
  };

  const createMockPace = (
    id: string,
    paceCatalogId: string,
    quarter: string,
    week: number,
    orderIndex: number,
    subjectId: string,
    deletedAt: Date | null = null
  ) => {
    return {
      id,
      projectionId: 'clh1111111111111111111111',
      paceCatalogId,
      quarter,
      week,
      grade: null,
      status: ProjectionPaceStatus.PENDING,
      deletedAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      paceCatalog: {
        id: paceCatalogId,
        code: `100${orderIndex}`,
        name: `Pace ${orderIndex}`,
        orderIndex,
        subjectId,
        categoryId: 'clh6666666666666666666666',
        createdAt: new Date(),
        updatedAt: new Date(),
        subject: {
          id: subjectId,
          name: 'Math',
          categoryId: 'clh6666666666666666666666',
          levelId: 'clh5555555555555555555555',
          difficulty: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          category: {
            id: 'clh6666666666666666666666',
            name: 'Math',
            description: null,
            displayOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      },
      gradeHistory: [],
      originalQuarter: null,
      originalWeek: null,
    };
  };

  it('moves a pace successfully', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace1 = createMockPace('clh8888888888888888888888', 'clhbbbbbbbbbbbbbbbbbbbbbb', 'Q1', 1, 1, subjectId);
    const pace2 = createMockPace('clh9999999999999999999999', 'clhcccccccccccccccccccccc', 'Q1', 2, 2, subjectId);
    const pace3 = createMockPace('clhaaaaaaaaaaaaaaaaaaaaaa', 'clhdddddddddddddddddddddd', 'Q1', 3, 3, subjectId);

    const projection = createMockProjection({
      projectionPaces: [pace1, pace2, pace3],
    });

    const updatedPace = {
      ...pace2,
      quarter: 'Q1',
      week: 4,
    };

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(projectionRepo.movePace).mockResolvedValue(updatedPace);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', 'clh9999999999999999999999', {
      quarter: 'Q1',
      week: 4,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(updatedPace);
    }
    expect(projectionRepo.movePace).toHaveBeenCalledWith('clh1111111111111111111111', 'clh9999999999999999999999', 'Q1', 4);
  });

  it('returns Err when projection does not exist', async () => {
    vi.mocked(projectionRepo.findById).mockResolvedValue(null);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', 'clh8888888888888888888888', {
      quarter: 'Q1',
      week: 2,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ObjectNotFoundError);
      expect(result.error.message).toContain('Projection with ID');
    }
  });

  it('returns Err when projection is closed', async () => {
    const projection = createMockProjection({
      status: ProjectionStatus.CLOSED,
    });

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', 'clh8888888888888888888888', {
      quarter: 'Q1',
      week: 2,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(InvalidEntityError);
      expect(result.error.message).toBe('Cannot edit closed projection');
    }
  });

  it('returns Err when pace does not exist', async () => {
    const projection = createMockProjection({
      projectionPaces: [],
    });

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', 'clh8888888888888888888888', {
      quarter: 'Q1',
      week: 2,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ObjectNotFoundError);
      expect(result.error.message).toContain('Pace with ID clh8888888888888888888888 not found');
    }
  });

  it('returns Err when pace is soft-deleted', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace1 = createMockPace('clh8888888888888888888888', 'clhbbbbbbbbbbbbbbbbbbbbbb', 'Q1', 1, 1, subjectId, new Date());

    const projection = createMockProjection({
      projectionPaces: [pace1],
    });

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', 'clh8888888888888888888888', {
      quarter: 'Q1',
      week: 2,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ObjectNotFoundError);
    }
  });

  it('returns Err when trying to move pace to position with higher orderIndex', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace1 = createMockPace('clh8888888888888888888888', 'clhbbbbbbbbbbbbbbbbbbbbbb', 'Q1', 1, 1, subjectId);
    const pace2 = createMockPace('clh9999999999999999999999', 'clhcccccccccccccccccccccc', 'Q1', 2, 2, subjectId);
    const pace3 = createMockPace('clhaaaaaaaaaaaaaaaaaaaaaa', 'clhdddddddddddddddddddddd', 'Q1', 3, 3, subjectId);

    const projection = createMockProjection({
      projectionPaces: [pace1, pace2, pace3],
    });

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', 'clh8888888888888888888888', {
      quarter: 'Q1',
      week: 3,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(InvalidEntityError);
      expect(result.error.message).toContain('cannot place pace with orderIndex 1 at position that already has pace with orderIndex 3');
    }
  });

  it('returns Err when trying to move pace after a pace with higher orderIndex', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace1 = createMockPace('clh8888888888888888888888', 'clhbbbbbbbbbbbbbbbbbbbbbb', 'Q1', 1, 1, subjectId);
    const pace2 = createMockPace('clh9999999999999999999999', 'clhcccccccccccccccccccccc', 'Q1', 2, 2, subjectId);
    const pace3 = createMockPace('clhaaaaaaaaaaaaaaaaaaaaaa', 'clhdddddddddddddddddddddd', 'Q1', 3, 3, subjectId);

    const projection = createMockProjection({
      projectionPaces: [pace1, pace2, pace3],
    });

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', 'clh8888888888888888888888', {
      quarter: 'Q1',
      week: 4,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(InvalidEntityError);
      expect(result.error.message).toContain('cannot place pace with orderIndex 1 after pace with orderIndex');
    }
  });

  it('allows moving pace to empty position', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace1 = createMockPace('clh8888888888888888888888', 'clhbbbbbbbbbbbbbbbbbbbbbb', 'Q1', 1, 1, subjectId);
    const pace2 = createMockPace('clh9999999999999999999999', 'clhcccccccccccccccccccccc', 'Q1', 2, 2, subjectId);

    const projection = createMockProjection({
      projectionPaces: [pace1, pace2],
    });

    const updatedPace = {
      ...pace1,
      quarter: 'Q1',
      week: 3,
    };

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(projectionRepo.movePace).mockResolvedValue(updatedPace);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', 'clh8888888888888888888888', {
      quarter: 'Q1',
      week: 3,
    });

    expect(result.success).toBe(true);
  });

  it('handles quarter format normalization (Q1 vs 1)', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace1 = createMockPace('clh8888888888888888888888', 'clhbbbbbbbbbbbbbbbbbbbbbb', '1', 1, 1, subjectId);
    const pace2 = createMockPace('clh9999999999999999999999', 'clhcccccccccccccccccccccc', '1', 2, 2, subjectId);

    const projection = createMockProjection({
      projectionPaces: [pace1, pace2],
    });

    const updatedPace = {
      ...pace1,
      quarter: 'Q2',
      week: 1,
    };

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(projectionRepo.movePace).mockResolvedValue(updatedPace);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', 'clh8888888888888888888888', {
      quarter: 'Q2',
      week: 1,
    });

    expect(result.success).toBe(true);
  });

  it('allows moving pace to position before paces with lower orderIndex', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace1 = createMockPace('clh8888888888888888888888', 'clhbbbbbbbbbbbbbbbbbbbbbb', 'Q1', 1, 1, subjectId);
    const pace2 = createMockPace('clh9999999999999999999999', 'clhcccccccccccccccccccccc', 'Q1', 2, 2, subjectId);
    const pace3 = createMockPace('clhaaaaaaaaaaaaaaaaaaaaaa', 'clhdddddddddddddddddddddd', 'Q1', 3, 3, subjectId);

    const projection = createMockProjection({
      projectionPaces: [pace1, pace2, pace3],
    });

    const updatedPace = {
      ...pace3,
      quarter: 'Q1',
      week: 1,
    };

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(projectionRepo.movePace).mockResolvedValue(updatedPace);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', 'clhaaaaaaaaaaaaaaaaaaaaaa', {
      quarter: 'Q1',
      week: 1,
    });

    expect(result.success).toBe(true);
  });

  it('filters out soft-deleted paces when checking sequential order', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace1 = createMockPace('clh8888888888888888888888', 'clhbbbbbbbbbbbbbbbbbbbbbb', 'Q1', 1, 1, subjectId);
    const pace2 = createMockPace('clh9999999999999999999999', 'clhcccccccccccccccccccccc', 'Q1', 2, 2, subjectId, new Date());
    const pace3 = createMockPace('clhaaaaaaaaaaaaaaaaaaaaaa', 'clhdddddddddddddddddddddd', 'Q1', 3, 3, subjectId);

    const projection = createMockProjection({
      projectionPaces: [pace1, pace2, pace3],
    });

    const updatedPace = {
      ...pace1,
      quarter: 'Q1',
      week: 4,
    };

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(projectionRepo.movePace).mockResolvedValue(updatedPace);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', 'clh8888888888888888888888', {
      quarter: 'Q1',
      week: 4,
    });

    expect(result.success).toBe(true);
  });
});
