import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AddPaceUseCase } from '../../../../core/application/use-cases/projections/AddPaceUseCase';
import { InvalidEntityError, ObjectNotFoundError, ObjectAlreadyExistsError } from '../../../../core/domain/errors';
import { createMockProjectionRepository, createMockPaceCatalogRepository } from '../../utils/mockRepositories';
import { ProjectionStatus, ProjectionPaceStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { ProjectionWithDetails } from '../../../../core/infrastructure/repositories/types/projections.types';

type PaceCatalogWithSubject = Prisma.PaceCatalogGetPayload<{
  include: {
    subject: {
      include: {
        category: true;
      };
    };
  };
}>;

describe('AddPaceUseCase', () => {
  let projectionRepo: ReturnType<typeof createMockProjectionRepository>;
  let paceCatalogRepo: ReturnType<typeof createMockPaceCatalogRepository>;
  let useCase: AddPaceUseCase;

  beforeEach(() => {
    projectionRepo = createMockProjectionRepository();
    paceCatalogRepo = createMockPaceCatalogRepository();
    useCase = new AddPaceUseCase(projectionRepo, paceCatalogRepo);
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

  const createMockPaceCatalog = (id: string, orderIndex: number, subjectId: string): PaceCatalogWithSubject => {
    return {
      id,
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
    };
  };

  it('adds a pace successfully', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace1 = createMockPace('clh8888888888888888888888', 'clhbbbbbbbbbbbbbbbbbbbbbb', 'Q1', 1, 1, subjectId);
    const pace2 = createMockPace('clh9999999999999999999999', 'clhcccccccccccccccccccccc', 'Q1', 2, 2, subjectId);

    const projection = createMockProjection({
      projectionPaces: [pace1, pace2],
    });

    const newPaceCatalog = createMockPaceCatalog('clhdddddddddddddddddddddd', 3, subjectId);
    const addedPace = createMockPace('clhaaaaaaaaaaaaaaaaaaaaaa', 'clhdddddddddddddddddddddd', 'Q1', 3, 3, subjectId);

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(paceCatalogRepo.findById).mockResolvedValue(newPaceCatalog);
    vi.mocked(projectionRepo.addPace).mockResolvedValue(addedPace);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
      paceCatalogId: 'clhdddddddddddddddddddddd',
      quarter: 'Q1',
      week: 3,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(addedPace);
    }
    expect(projectionRepo.addPace).toHaveBeenCalledWith('clh1111111111111111111111', 'clhdddddddddddddddddddddd', 'Q1', 3);
  });

  it('returns Err when projection does not exist', async () => {
    vi.mocked(projectionRepo.findById).mockResolvedValue(null);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
      paceCatalogId: 'clhbbbbbbbbbbbbbbbbbbbbbb',
      quarter: 'Q1',
      week: 1,
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

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
      paceCatalogId: 'clhbbbbbbbbbbbbbbbbbbbbbb',
      quarter: 'Q1',
      week: 1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(InvalidEntityError);
      expect(result.error.message).toBe('Cannot edit closed projection');
    }
  });

  it('returns Err when pace catalog does not exist', async () => {
    const projection = createMockProjection();

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(paceCatalogRepo.findById).mockResolvedValue(null);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
      paceCatalogId: 'clhbbbbbbbbbbbbbbbbbbbbbb',
      quarter: 'Q1',
      week: 1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ObjectNotFoundError);
      expect(result.error.message).toContain('Pace catalog with ID');
    }
  });

  it('returns Err when pace is already in projection', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace1 = createMockPace('clh8888888888888888888888', 'clhbbbbbbbbbbbbbbbbbbbbbb', 'Q1', 1, 1, subjectId);

    const projection = createMockProjection({
      projectionPaces: [pace1],
    });

    const paceCatalog = createMockPaceCatalog('clhbbbbbbbbbbbbbbbbbbbbbb', 1, subjectId);

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(paceCatalogRepo.findById).mockResolvedValue(paceCatalog);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
      paceCatalogId: 'clhbbbbbbbbbbbbbbbbbbbbbb',
      quarter: 'Q1',
      week: 2,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ObjectAlreadyExistsError);
      expect(result.error.message).toBe('This pace is already in the projection');
    }
  });

  it('returns Err when trying to add pace to position with higher orderIndex', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace1 = createMockPace('clh8888888888888888888888', 'clhbbbbbbbbbbbbbbbbbbbbbb', 'Q1', 1, 1, subjectId);
    const pace3 = createMockPace('clhaaaaaaaaaaaaaaaaaaaaaa', 'clhdddddddddddddddddddddd', 'Q1', 3, 3, subjectId);

    const projection = createMockProjection({
      projectionPaces: [pace1, pace3],
    });

    const newPaceCatalog = createMockPaceCatalog('clhcccccccccccccccccccccc', 2, subjectId);

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(paceCatalogRepo.findById).mockResolvedValue(newPaceCatalog);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
      paceCatalogId: 'clhcccccccccccccccccccccc',
      quarter: 'Q1',
      week: 3,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(InvalidEntityError);
      expect(result.error.message).toContain('cannot place pace with orderIndex 2 at position that already has pace with orderIndex 3');
    }
  });

  it('returns Err when trying to add pace after a pace with higher orderIndex', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace1 = createMockPace('clh8888888888888888888888', 'clhbbbbbbbbbbbbbbbbbbbbbb', 'Q1', 1, 1, subjectId);
    const pace3 = createMockPace('clhaaaaaaaaaaaaaaaaaaaaaa', 'clhdddddddddddddddddddddd', 'Q1', 3, 3, subjectId);

    const projection = createMockProjection({
      projectionPaces: [pace1, pace3],
    });

    const newPaceCatalog = createMockPaceCatalog('clhcccccccccccccccccccccc', 2, subjectId);

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(paceCatalogRepo.findById).mockResolvedValue(newPaceCatalog);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
      paceCatalogId: 'clhcccccccccccccccccccccc',
      quarter: 'Q1',
      week: 4,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(InvalidEntityError);
      expect(result.error.message).toContain('cannot place pace with orderIndex 2 after pace with orderIndex');
    }
  });

  it('allows adding pace to empty position', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace1 = createMockPace('clh8888888888888888888888', 'clhbbbbbbbbbbbbbbbbbbbbbb', 'Q1', 1, 1, subjectId);
    const pace2 = createMockPace('clh9999999999999999999999', 'clhcccccccccccccccccccccc', 'Q1', 2, 2, subjectId);

    const projection = createMockProjection({
      projectionPaces: [pace1, pace2],
    });

    const newPaceCatalog = createMockPaceCatalog('clhdddddddddddddddddddddd', 3, subjectId);
    const addedPace = createMockPace('clhaaaaaaaaaaaaaaaaaaaaaa', 'clhdddddddddddddddddddddd', 'Q1', 3, 3, subjectId);

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(paceCatalogRepo.findById).mockResolvedValue(newPaceCatalog);
    vi.mocked(projectionRepo.addPace).mockResolvedValue(addedPace);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
      paceCatalogId: 'clhdddddddddddddddddddddd',
      quarter: 'Q1',
      week: 3,
    });

    expect(result.success).toBe(true);
  });

  it('handles quarter format normalization (Q1 vs 1)', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace1 = createMockPace('clh8888888888888888888888', 'clhbbbbbbbbbbbbbbbbbbbbbb', '1', 1, 1, subjectId);

    const projection = createMockProjection({
      projectionPaces: [pace1],
    });

    const newPaceCatalog = createMockPaceCatalog('clhcccccccccccccccccccccc', 2, subjectId);
    const addedPace = createMockPace('clh9999999999999999999999', 'clhcccccccccccccccccccccc', 'Q2', 1, 2, subjectId);

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(paceCatalogRepo.findById).mockResolvedValue(newPaceCatalog);
    vi.mocked(projectionRepo.addPace).mockResolvedValue(addedPace);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
      paceCatalogId: 'clhcccccccccccccccccccccc',
      quarter: 'Q2',
      week: 1,
    });

    expect(result.success).toBe(true);
  });

  it('allows adding pace before paces with lower orderIndex', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace2 = createMockPace('clh9999999999999999999999', 'clhcccccccccccccccccccccc', 'Q1', 2, 2, subjectId);
    const pace3 = createMockPace('clhaaaaaaaaaaaaaaaaaaaaaa', 'clhdddddddddddddddddddddd', 'Q1', 3, 3, subjectId);

    const projection = createMockProjection({
      projectionPaces: [pace2, pace3],
    });

    const newPaceCatalog = createMockPaceCatalog('clhbbbbbbbbbbbbbbbbbbbbbb', 1, subjectId);
    const addedPace = createMockPace('clh8888888888888888888888', 'clhbbbbbbbbbbbbbbbbbbbbbb', 'Q1', 1, 1, subjectId);

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(paceCatalogRepo.findById).mockResolvedValue(newPaceCatalog);
    vi.mocked(projectionRepo.addPace).mockResolvedValue(addedPace);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
      paceCatalogId: 'clhbbbbbbbbbbbbbbbbbbbbbb',
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

    const newPaceCatalog = createMockPaceCatalog('clheeeeeeeeeeeeeeeeeeeeee', 4, subjectId);
    const addedPace = createMockPace('clhffffffffffffffffffffff', 'clheeeeeeeeeeeeeeeeeeeeee', 'Q1', 4, 4, subjectId);

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(paceCatalogRepo.findById).mockResolvedValue(newPaceCatalog);
    vi.mocked(projectionRepo.addPace).mockResolvedValue(addedPace);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
      paceCatalogId: 'clheeeeeeeeeeeeeeeeeeeeee',
      quarter: 'Q1',
      week: 4,
    });

    expect(result.success).toBe(true);
  });

  it('allows adding pace to different quarter', async () => {
    const subjectId = 'clh7777777777777777777777';
    const pace1 = createMockPace('clh8888888888888888888888', 'clhbbbbbbbbbbbbbbbbbbbbbb', 'Q1', 1, 1, subjectId);
    const pace2 = createMockPace('clh9999999999999999999999', 'clhcccccccccccccccccccccc', 'Q1', 2, 2, subjectId);

    const projection = createMockProjection({
      projectionPaces: [pace1, pace2],
    });

    const newPaceCatalog = createMockPaceCatalog('clhdddddddddddddddddddddd', 3, subjectId);
    const addedPace = createMockPace('clhaaaaaaaaaaaaaaaaaaaaaa', 'clhdddddddddddddddddddddd', 'Q2', 1, 3, subjectId);

    vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
    vi.mocked(paceCatalogRepo.findById).mockResolvedValue(newPaceCatalog);
    vi.mocked(projectionRepo.addPace).mockResolvedValue(addedPace);

    const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
      paceCatalogId: 'clhdddddddddddddddddddddd',
      quarter: 'Q2',
      week: 1,
    });

    expect(result.success).toBe(true);
  });

  it('returns Err when projection belongs to different school (tenant isolation)', async () => {
    vi.mocked(projectionRepo.findById).mockResolvedValue(null); // Repository returns null when schoolId doesn't match

    const result = await useCase.execute('clh1111111111111111111111', 'clh9999999999999999999999', { // Different schoolId
      paceCatalogId: 'clhbbbbbbbbbbbbbbbbbbbbbb',
      quarter: 'Q1',
      week: 1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ObjectNotFoundError);
      expect(result.error.message).toContain('Projection with ID');
    }
    expect(projectionRepo.findById).toHaveBeenCalledWith('clh1111111111111111111111', 'clh9999999999999999999999');
  });
});
