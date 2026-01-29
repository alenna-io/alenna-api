import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarkUngradedUseCase } from '../../../../core/application/use-cases/projections/MarkUngradedUseCase';
import { InvalidEntityError, ObjectNotFoundError } from '../../../../core/domain/errors';
import { createMockProjectionRepository } from '../../utils/mockRepositories';
import { ProjectionStatus, ProjectionPaceStatus } from '@prisma/client';
import { ProjectionWithDetails } from '../../../../core/infrastructure/repositories/types/projections.types';

describe('MarkUngradedUseCase', () => {
  let projectionRepo: ReturnType<typeof createMockProjectionRepository>;
  let useCase: MarkUngradedUseCase;

  beforeEach(() => {
    projectionRepo = createMockProjectionRepository();
    useCase = new MarkUngradedUseCase(projectionRepo);
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
    grade: number | null = null,
    status: ProjectionPaceStatus = ProjectionPaceStatus.PENDING,
    deletedAt: Date | null = null
  ) => {
    return {
      id,
      projectionId: 'clh1111111111111111111111',
      paceCatalogId,
      quarter,
      week,
      grade,
      status,
      deletedAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      paceCatalog: {
        id: paceCatalogId,
        code: `100${orderIndex}`,
        orderIndex,
        subjectId,
        levelId: 'clh5555555555555555555555',
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

  it('marks pace as ungraded successfully', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace1 = createMockPace('clh8888888888888888888888', 'clhbbbbbbbbbbbbbbbbbbbbb', 'Q1', 1, 1, subjectId, 85, ProjectionPaceStatus.COMPLETED);

    const projection = createMockProjection({
      projectionPaces: [pace1],
    });

    const updatedPace = {
      ...pace1,
      grade: null,
      status: ProjectionPaceStatus.PENDING,
    } as typeof pace1;

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(projectionRepo.markUngraded).mockResolvedValue(updatedPace);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', 'clh8888888888888888888888');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.grade).toBeNull();
      expect(result.data.status).toBe(ProjectionPaceStatus.PENDING);
    }
    expect(projectionRepo.markUngraded).toHaveBeenCalledWith('clh1111111111111111111111', 'clh8888888888888888888888');
  });

  it('marks pace with failing grade as ungraded', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace1 = createMockPace('clh8888888888888888888888', 'clhbbbbbbbbbbbbbbbbbbbbb', 'Q1', 1, 1, subjectId, 75, ProjectionPaceStatus.FAILED);

    const projection = createMockProjection({
      projectionPaces: [pace1],
    });

    const updatedPace = {
      ...pace1,
      grade: null,
      status: ProjectionPaceStatus.PENDING,
    } as typeof pace1;

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(projectionRepo.markUngraded).mockResolvedValue(updatedPace);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', 'clh8888888888888888888888');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.grade).toBeNull();
      expect(result.data.status).toBe(ProjectionPaceStatus.PENDING);
    }
  });

  it('marks pace that is already ungraded as ungraded (idempotent)', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace1 = createMockPace('clh8888888888888888888888', 'clhbbbbbbbbbbbbbbbbbbbbb', 'Q1', 1, 1, subjectId, null, ProjectionPaceStatus.PENDING);

    const projection = createMockProjection({
      projectionPaces: [pace1],
    });

    const updatedPace = {
      ...pace1,
      grade: null,
      status: ProjectionPaceStatus.PENDING,
    } as typeof pace1;

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(projectionRepo.markUngraded).mockResolvedValue(updatedPace);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', 'clh8888888888888888888888');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.grade).toBeNull();
      expect(result.data.status).toBe(ProjectionPaceStatus.PENDING);
    }
  });

  it('returns Err when projection does not exist', async () => {
    vi.mocked(projectionRepo.findById).mockResolvedValue(null);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', 'clh8888888888888888888888');

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

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', 'clh8888888888888888888888');

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

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', 'clh8888888888888888888888');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ObjectNotFoundError);
      expect(result.error.message).toContain('Pace with ID clh8888888888888888888888 not found');
    }
  });

  it('returns Err when pace is soft-deleted', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace1 = createMockPace('clh8888888888888888888888', 'clhbbbbbbbbbbbbbbbbbbbbb', 'Q1', 1, 1, subjectId, 85, ProjectionPaceStatus.COMPLETED, new Date());

    const projection = createMockProjection({
      projectionPaces: [pace1],
    });

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', 'clh8888888888888888888888');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ObjectNotFoundError);
    }
  });
});
