import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AddSubjectUseCase } from '../../../../core/application/use-cases/projections/AddSubjectUseCase';
import { InvalidEntityError, ObjectNotFoundError } from '../../../../core/domain/errors';
import {
  createMockProjectionRepository,
  createMockSubjectRepository,
  createMockCategoryRepository,
} from '../../utils/mockRepositories';
import { ProjectionStatus } from '@prisma/client';
import { ProjectionWithDetails } from '../../../../core/infrastructure/repositories/types/projections.types';

describe('AddSubjectUseCase', () => {
  let projectionRepo: ReturnType<typeof createMockProjectionRepository>;
  let subjectRepo: ReturnType<typeof createMockSubjectRepository>;
  let categoryRepo: ReturnType<typeof createMockCategoryRepository>;
  let useCase: AddSubjectUseCase;

  beforeEach(() => {
    projectionRepo = createMockProjectionRepository();
    subjectRepo = createMockSubjectRepository();
    categoryRepo = createMockCategoryRepository();
    useCase = new AddSubjectUseCase(projectionRepo, subjectRepo, categoryRepo);
    vi.clearAllMocks();
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

  const createMockSubject = (id: string, name: string, categoryId: string) => {
    return {
      id,
      name,
      categoryId,
      levelId: 'clh5555555555555555555555',
      difficulty: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  const createMockCategory = (id: string, name: string) => {
    return {
      id,
      name,
      description: null,
      displayOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  const createMockProjectionSubject = (
    id: string,
    subjectId: string,
    categoryId: string,
    deletedAt: Date | null = null
  ) => {
    return {
      id,
      projectionId: 'clh1111111111111111111111',
      subjectId,
      deletedAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      subject: {
        id: subjectId,
        name: 'Test Subject',
        categoryId,
        levelId: 'clh5555555555555555555555',
        difficulty: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: {
          id: categoryId,
          name: 'Test Category',
          description: null,
          displayOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    };
  };

  describe('Success cases', () => {
    it('adds an elective subject successfully', async () => {
      const projection = createMockProjection();
      const electiveSubject = createMockSubject('clh8888888888888888888888', 'Art', 'clh9999999999999999999999');
      const electivesCategory = createMockCategory('clh9999999999999999999999', 'Electives');

      vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
      vi.mocked(subjectRepo.findById).mockResolvedValue(electiveSubject);
      vi.mocked(categoryRepo.findManyByIds).mockResolvedValue([electivesCategory]);
      vi.mocked(projectionRepo.addSubject).mockResolvedValue({} as any);

      const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
        subjectId: 'clh8888888888888888888888',
      });

      expect(result.success).toBe(true);
      expect(projectionRepo.addSubject).toHaveBeenCalledWith('clh1111111111111111111111', 'clh8888888888888888888888');
    });

    it('adds a non-elective category representative successfully', async () => {
      const projection = createMockProjection();
      const mathSubject = createMockSubject('clhaaaaaaaaaaaaaaaaaaaaaa', 'Math Level 1', 'clhbbbbbbbbbbbbbbbbbbbbbb');
      const mathCategory = createMockCategory('clhbbbbbbbbbbbbbbbbbbbbbb', 'Math');

      vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
      vi.mocked(subjectRepo.findById).mockResolvedValue(mathSubject);
      vi.mocked(categoryRepo.findManyByIds).mockResolvedValue([mathCategory]);
      vi.mocked(projectionRepo.addSubject).mockResolvedValue({} as any);

      const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
        subjectId: 'clhaaaaaaaaaaaaaaaaaaaaaa',
      });

      expect(result.success).toBe(true);
      expect(projectionRepo.addSubject).toHaveBeenCalledWith('clh1111111111111111111111', 'clhaaaaaaaaaaaaaaaaaaaaaa');
    });

    it('allows adding multiple electives (no limit)', async () => {
      const projection = createMockProjection({
        projectionSubjects: [
          createMockProjectionSubject('clhps111111111111111111111', 'clhel11111111111111111111', 'clh9999999999999999999999'),
          createMockProjectionSubject('clhps222222222222222222222', 'clhel22222222222222222222', 'clh9999999999999999999999'),
          createMockProjectionSubject('clhps333333333333333333333', 'clhel33333333333333333333', 'clh9999999999999999999999'),
          createMockProjectionSubject('clhps444444444444444444444', 'clhel44444444444444444444', 'clh9999999999999999999999'),
          createMockProjectionSubject('clhps555555555555555555555', 'clhel55555555555555555555', 'clh9999999999999999999999'),
          createMockProjectionSubject('clhps666666666666666666666', 'clhel66666666666666666666', 'clh9999999999999999999999'),
          createMockProjectionSubject('clhps777777777777777777777', 'clhel77777777777777777777', 'clh9999999999999999999999'),
          createMockProjectionSubject('clhps888888888888888888888', 'clhel88888888888888888888', 'clh9999999999999999999999'),
        ],
      });
      const electiveSubject = createMockSubject('clhel99999999999999999999', 'Art', 'clh9999999999999999999999');
      const electivesCategory = createMockCategory('clh9999999999999999999999', 'Electives');

      vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
      vi.mocked(subjectRepo.findById).mockResolvedValue(electiveSubject);
      vi.mocked(categoryRepo.findManyByIds).mockResolvedValue([electivesCategory]);
      vi.mocked(projectionRepo.addSubject).mockResolvedValue({} as any);

      const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
        subjectId: 'clhel99999999999999999999',
      });

      expect(result.success).toBe(true);
      expect(projectionRepo.addSubject).toHaveBeenCalledWith('clh1111111111111111111111', 'clhel99999999999999999999');
    });
  });

  describe('Validation failures', () => {
    it('rejects when trying to add elective subject that already exists', async () => {
      const projection = createMockProjection({
        projectionSubjects: [createMockProjectionSubject('clhps111111111111111111111', 'clhel11111111111111111111', 'clh9999999999999999999999')],
      });
      const electiveSubject = createMockSubject('clhel11111111111111111111', 'Art', 'clh9999999999999999999999');
      const electivesCategory = createMockCategory('clh9999999999999999999999', 'Electives');

      vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
      vi.mocked(subjectRepo.findById).mockResolvedValue(electiveSubject);
      vi.mocked(categoryRepo.findManyByIds).mockResolvedValue([electivesCategory]);

      const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
        subjectId: 'clhel11111111111111111111',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(InvalidEntityError);
        expect(result.error.message).toContain('elective subject is already in the projection');
      }
      expect(projectionRepo.addSubject).not.toHaveBeenCalled();
    });

    it('rejects when trying to add non-elective subject when category already has a representative', async () => {
      const projection = createMockProjection({
        projectionSubjects: [createMockProjectionSubject('clhps111111111111111111111', 'clhaaaaaaaaaaaaaaaaaaaaaa', 'clhbbbbbbbbbbbbbbbbbbbbbb')],
      });
      const mathSubject2 = createMockSubject('clhcccccccccccccccccccccc', 'Math Level 2', 'clhbbbbbbbbbbbbbbbbbbbbbb');
      const mathCategory = createMockCategory('clhbbbbbbbbbbbbbbbbbbbbbb', 'Math');

      vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
      vi.mocked(subjectRepo.findById).mockResolvedValue(mathSubject2);
      vi.mocked(categoryRepo.findManyByIds).mockResolvedValue([mathCategory]);

      const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
        subjectId: 'clhcccccccccccccccccccccc',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(InvalidEntityError);
        expect(result.error.message).toContain('category already has a representative');
      }
      expect(projectionRepo.addSubject).not.toHaveBeenCalled();
    });

    it('rejects when category already has a representative from paces', async () => {
      const projection = createMockProjection({
        projectionPaces: [
          {
            id: 'clhpace11111111111111111111',
            projectionId: 'clh1111111111111111111111',
            paceCatalogId: 'clhpc111111111111111111111',
            quarter: 'Q1',
            week: 1,
            grade: null,
            status: 'PENDING' as any,
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            originalQuarter: null,
            originalWeek: null,
            paceCatalog: {
              id: 'clhpc111111111111111111111',
              code: '1001',
              name: 'Pace 1',
              orderIndex: 1,
              subjectId: 'clhaaaaaaaaaaaaaaaaaaaaaa',
              categoryId: 'clhbbbbbbbbbbbbbbbbbbbbbb',
              createdAt: new Date(),
              updatedAt: new Date(),
              subject: {
                id: 'clhaaaaaaaaaaaaaaaaaaaaaa',
                name: 'Math Level 1',
                categoryId: 'clhbbbbbbbbbbbbbbbbbbbbbb',
                levelId: 'clh5555555555555555555555',
                difficulty: 3,
                createdAt: new Date(),
                updatedAt: new Date(),
                category: {
                  id: 'clhbbbbbbbbbbbbbbbbbbbbbb',
                  name: 'Math',
                  description: null,
                  displayOrder: 1,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              },
            },
            gradeHistory: [],
          },
        ],
      });
      const mathSubject2 = createMockSubject('clhcccccccccccccccccccccc', 'Math Level 2', 'clhbbbbbbbbbbbbbbbbbbbbbb');
      const mathCategory = createMockCategory('clhbbbbbbbbbbbbbbbbbbbbbb', 'Math');

      vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
      vi.mocked(subjectRepo.findById).mockResolvedValue(mathSubject2);
      vi.mocked(categoryRepo.findManyByIds).mockResolvedValue([mathCategory]);

      const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
        subjectId: 'clhcccccccccccccccccccccc',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(InvalidEntityError);
        expect(result.error.message).toContain('category already has a representative');
      }
      expect(projectionRepo.addSubject).not.toHaveBeenCalled();
    });

    it('rejects when projection is closed', async () => {
      const projection = createMockProjection({
        status: ProjectionStatus.CLOSED,
      });
      const electiveSubject = createMockSubject('clh8888888888888888888888', 'Art', 'clh9999999999999999999999');

      vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
      vi.mocked(subjectRepo.findById).mockResolvedValue(electiveSubject);

      const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
        subjectId: 'clh8888888888888888888888',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(InvalidEntityError);
        expect(result.error.message).toContain('Cannot edit closed projection');
      }
      expect(projectionRepo.addSubject).not.toHaveBeenCalled();
    });

    it('rejects when subject does not exist', async () => {
      const projection = createMockProjection();

      vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
      vi.mocked(subjectRepo.findById).mockResolvedValue(null);

      const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
        subjectId: 'clhnonexistent11111111111',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ObjectNotFoundError);
        expect(result.error.message).toContain('Subject');
      }
      expect(projectionRepo.addSubject).not.toHaveBeenCalled();
    });

    it('rejects when projection does not exist', async () => {
      vi.mocked(projectionRepo.findById).mockResolvedValue(null);

      const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
        subjectId: 'clh8888888888888888888888',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ObjectNotFoundError);
        expect(result.error.message).toContain('Projection');
      }
      expect(projectionRepo.addSubject).not.toHaveBeenCalled();
    });

    it('rejects when category does not exist', async () => {
      const projection = createMockProjection();
      const subject = createMockSubject('clh8888888888888888888888', 'Test', 'clhnonexistent111111111111');

      vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
      vi.mocked(subjectRepo.findById).mockResolvedValue(subject);
      vi.mocked(categoryRepo.findManyByIds).mockResolvedValue([]);

      const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
        subjectId: 'clh8888888888888888888888',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ObjectNotFoundError);
        expect(result.error.message).toContain('Category');
      }
      expect(projectionRepo.addSubject).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('handles projection with multiple electives', async () => {
      const projection = createMockProjection({
        projectionSubjects: [
          createMockProjectionSubject('clhps111111111111111111111', 'clhel11111111111111111111', 'clh9999999999999999999999'),
          createMockProjectionSubject('clhps222222222222222222222', 'clhel22222222222222222222', 'clh9999999999999999999999'),
        ],
      });
      const electiveSubject = createMockSubject('clhel33333333333333333333', 'Music', 'clh9999999999999999999999');
      const electivesCategory = createMockCategory('clh9999999999999999999999', 'Electives');

      vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
      vi.mocked(subjectRepo.findById).mockResolvedValue(electiveSubject);
      vi.mocked(categoryRepo.findManyByIds).mockResolvedValue([electivesCategory]);
      vi.mocked(projectionRepo.addSubject).mockResolvedValue({} as any);

      const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
        subjectId: 'clhel33333333333333333333',
      });

      expect(result.success).toBe(true);
      expect(projectionRepo.addSubject).toHaveBeenCalled();
    });

    it('handles projection with multiple non-elective categories', async () => {
      const projection = createMockProjection({
        projectionSubjects: [
          createMockProjectionSubject('clhps111111111111111111111', 'clhaaaaaaaaaaaaaaaaaaaaaa', 'clhbbbbbbbbbbbbbbbbbbbbbb'),
          createMockProjectionSubject('clhps222222222222222222222', 'clhdddddddddddddddddddddd', 'clheeeeeeeeeeeeeeeeeeeeee'),
        ],
      });
      const scienceSubject = createMockSubject('clhffffffffffffffffffffff', 'Science Level 1', 'clhgggggggggggggggggggggg');
      const scienceCategory = createMockCategory('clhgggggggggggggggggggggg', 'Science');

      vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
      vi.mocked(subjectRepo.findById).mockResolvedValue(scienceSubject);
      vi.mocked(categoryRepo.findManyByIds).mockResolvedValue([scienceCategory]);
      vi.mocked(projectionRepo.addSubject).mockResolvedValue({} as any);

      const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
        subjectId: 'clhffffffffffffffffffffff',
      });

      expect(result.success).toBe(true);
      expect(projectionRepo.addSubject).toHaveBeenCalled();
    });

    it('handles projection with mix of electives and non-electives', async () => {
      const projection = createMockProjection({
        projectionSubjects: [
          createMockProjectionSubject('clhps111111111111111111111', 'clhaaaaaaaaaaaaaaaaaaaaaa', 'clhbbbbbbbbbbbbbbbbbbbbbb'),
          createMockProjectionSubject('clhps222222222222222222222', 'clhel11111111111111111111', 'clh9999999999999999999999'),
        ],
      });
      const electiveSubject = createMockSubject('clhel22222222222222222222', 'Art', 'clh9999999999999999999999');
      const electivesCategory = createMockCategory('clh9999999999999999999999', 'Electives');

      vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
      vi.mocked(subjectRepo.findById).mockResolvedValue(electiveSubject);
      vi.mocked(categoryRepo.findManyByIds).mockResolvedValue([electivesCategory]);
      vi.mocked(projectionRepo.addSubject).mockResolvedValue({} as any);

      const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
        subjectId: 'clhel22222222222222222222',
      });

      expect(result.success).toBe(true);
      expect(projectionRepo.addSubject).toHaveBeenCalled();
    });

    it('rejects adding subject from same category but different subject (non-electives)', async () => {
      const projection = createMockProjection({
        projectionSubjects: [createMockProjectionSubject('clhps111111111111111111111', 'clhaaaaaaaaaaaaaaaaaaaaaa', 'clhbbbbbbbbbbbbbbbbbbbbbb')],
      });
      const mathSubject2 = createMockSubject('clhcccccccccccccccccccccc', 'Math Level 2', 'clhbbbbbbbbbbbbbbbbbbbbbb');
      const mathCategory = createMockCategory('clhbbbbbbbbbbbbbbbbbbbbbb', 'Math');

      vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
      vi.mocked(subjectRepo.findById).mockResolvedValue(mathSubject2);
      vi.mocked(categoryRepo.findManyByIds).mockResolvedValue([mathCategory]);

      const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
        subjectId: 'clhcccccccccccccccccccccc',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(InvalidEntityError);
        expect(result.error.message).toContain('category already has a representative');
      }
      expect(projectionRepo.addSubject).not.toHaveBeenCalled();
    });

    it('ignores soft-deleted projection subjects when checking categories', async () => {
      const projection = createMockProjection({
        projectionSubjects: [
          createMockProjectionSubject('clhps111111111111111111111', 'clhaaaaaaaaaaaaaaaaaaaaaa', 'clhbbbbbbbbbbbbbbbbbbbbbb', new Date()),
        ],
      });
      const mathSubject2 = createMockSubject('clhcccccccccccccccccccccc', 'Math Level 2', 'clhbbbbbbbbbbbbbbbbbbbbbb');
      const mathCategory = createMockCategory('clhbbbbbbbbbbbbbbbbbbbbbb', 'Math');

      vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
      vi.mocked(subjectRepo.findById).mockResolvedValue(mathSubject2);
      vi.mocked(categoryRepo.findManyByIds).mockResolvedValue([mathCategory]);
      vi.mocked(projectionRepo.addSubject).mockResolvedValue({} as any);

      const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
        subjectId: 'clhcccccccccccccccccccccc',
      });

      expect(result.success).toBe(true);
      expect(projectionRepo.addSubject).toHaveBeenCalled();
    });

    it('ignores soft-deleted paces when checking categories', async () => {
      const projection = createMockProjection({
        projectionPaces: [
          {
            id: 'clhpace11111111111111111111',
            projectionId: 'clh1111111111111111111111',
            paceCatalogId: 'clhpc111111111111111111111',
            quarter: 'Q1',
            week: 1,
            grade: null,
            status: 'PENDING' as any,
            deletedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            originalQuarter: null,
            originalWeek: null,
            paceCatalog: {
              id: 'clhpc111111111111111111111',
              code: '1001',
              name: 'Pace 1',
              orderIndex: 1,
              subjectId: 'clhaaaaaaaaaaaaaaaaaaaaaa',
              categoryId: 'clhbbbbbbbbbbbbbbbbbbbbbb',
              createdAt: new Date(),
              updatedAt: new Date(),
              subject: {
                id: 'clhaaaaaaaaaaaaaaaaaaaaaa',
                name: 'Math Level 1',
                categoryId: 'clhbbbbbbbbbbbbbbbbbbbbbb',
                levelId: 'clh5555555555555555555555',
                difficulty: 3,
                createdAt: new Date(),
                updatedAt: new Date(),
                category: {
                  id: 'clhbbbbbbbbbbbbbbbbbbbbbb',
                  name: 'Math',
                  description: null,
                  displayOrder: 1,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              },
            },
            gradeHistory: [],
          },
        ],
      });
      const mathSubject2 = createMockSubject('clhcccccccccccccccccccccc', 'Math Level 2', 'clhbbbbbbbbbbbbbbbbbbbbbb');
      const mathCategory = createMockCategory('clhbbbbbbbbbbbbbbbbbbbbbb', 'Math');

      vi.mocked(projectionRepo.findById).mockResolvedValue(projection);
      vi.mocked(subjectRepo.findById).mockResolvedValue(mathSubject2);
      vi.mocked(categoryRepo.findManyByIds).mockResolvedValue([mathCategory]);
      vi.mocked(projectionRepo.addSubject).mockResolvedValue({} as any);

      const result = await useCase.execute('clh1111111111111111111111', 'clh3333333333333333333333', {
        subjectId: 'clhcccccccccccccccccccccc',
      });

      expect(result.success).toBe(true);
      expect(projectionRepo.addSubject).toHaveBeenCalled();
    });
  });
});
