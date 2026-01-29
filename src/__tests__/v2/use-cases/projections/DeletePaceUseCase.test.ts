import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeletePaceUseCase } from '../../../../core/application/use-cases/projections/DeletePaceUseCase';
import { InvalidEntityError, ObjectNotFoundError } from '../../../../core/domain/errors';
import { createMockProjectionRepository } from '../../utils/mockRepositories';
import { ProjectionStatus, ProjectionPaceStatus } from '@prisma/client';
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

describe('DeletePaceUseCase', () => {
  let projectionRepo: ReturnType<typeof createMockProjectionRepository>;
  let useCase: DeletePaceUseCase;

  beforeEach(() => {
    projectionRepo = createMockProjectionRepository();
    useCase = new DeletePaceUseCase(projectionRepo);
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
          createdAt: new Date(),
          updatedAt: new Date(),
          category: {
            id: 'clh6666666666666666666666',
            name: 'Math',
            displayOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      },
    };
  };

  it('deletes a pace successfully', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace1Id = 'clh8888888888888888888888';
    const pace2Id = 'clh9999999999999999999999';
    const catalog1Id = 'clhaaaaaaaaaaaaaaaaaaaaaa';
    const catalog2Id = 'clhbbbbbbbbbbbbbbbbbbbbb';
    const pace1 = createMockPace(pace1Id, catalog1Id, 'Q1', 1, 1, subjectId);
    const pace2 = createMockPace(pace2Id, catalog2Id, 'Q1', 2, 2, subjectId);

    const projection = createMockProjection({
      projectionPaces: [pace1, pace2],
    });

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(projectionRepo.deletePace).mockResolvedValue(undefined);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', pace1Id);

    expect(result.success).toBe(true);
    expect(projectionRepo.deletePace).toHaveBeenCalledWith('clh1111111111111111111111', pace1Id);
  });

  it('returns Err when projection does not exist', async () => {
    vi.mocked(projectionRepo.findById).mockResolvedValue(null);

    const pace1Id = 'clh8888888888888888888888';
    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', pace1Id);

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

    const pace1Id = 'clh8888888888888888888888';
    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', pace1Id);

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

    const pace1Id = 'clh8888888888888888888888';
    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', pace1Id);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ObjectNotFoundError);
      expect(result.error.message).toContain(`Pace with ID ${pace1Id} not found`);
    }
  });

  it('returns Err when pace is soft-deleted', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace1Id = 'clh8888888888888888888888';
    const catalog1Id = 'clhaaaaaaaaaaaaaaaaaaaaaa';
    const pace1 = createMockPace(pace1Id, catalog1Id, 'Q1', 1, 1, subjectId, null, ProjectionPaceStatus.PENDING, new Date());

    const projection = createMockProjection({
      projectionPaces: [pace1],
    });

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', pace1Id);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ObjectNotFoundError);
    }
  });

  it('returns Err when pace has a grade', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace1Id = 'clh8888888888888888888888';
    const catalog1Id = 'clhaaaaaaaaaaaaaaaaaaaaaa';
    const pace1 = createMockPace(pace1Id, catalog1Id, 'Q1', 1, 1, subjectId, 85);

    const projection = createMockProjection({
      projectionPaces: [pace1],
    });

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', pace1Id);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(InvalidEntityError);
      expect(result.error.message).toBe('Cannot delete graded pace');
    }
  });

  it('returns Err when pace status is not PENDING', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace1Id = 'clh8888888888888888888888';
    const catalog1Id = 'clhaaaaaaaaaaaaaaaaaaaaaa';
    const pace1 = createMockPace(pace1Id, catalog1Id, 'Q1', 1, 1, subjectId, null, ProjectionPaceStatus.COMPLETED);

    const projection = createMockProjection({
      projectionPaces: [pace1],
    });

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', pace1Id);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(InvalidEntityError);
      expect(result.error.message).toBe('Cannot delete graded pace');
    }
  });

  it('allows deleting pace with null grade and PENDING status', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace1Id = 'clh8888888888888888888888';
    const pace2Id = 'clh9999999999999999999999';
    const catalog1Id = 'clhaaaaaaaaaaaaaaaaaaaaaa';
    const catalog2Id = 'clhbbbbbbbbbbbbbbbbbbbbb';
    const pace1 = createMockPace(pace1Id, catalog1Id, 'Q1', 1, 1, subjectId, null, ProjectionPaceStatus.PENDING);
    const pace2 = createMockPace(pace2Id, catalog2Id, 'Q1', 2, 2, subjectId);

    const projection = createMockProjection({
      projectionPaces: [pace1, pace2],
    });

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(projectionRepo.deletePace).mockResolvedValue(undefined);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', pace1Id);

    expect(result.success).toBe(true);
  });
});
