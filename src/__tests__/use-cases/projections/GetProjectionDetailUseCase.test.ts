import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetProjectionDetailUseCase } from '../../../core/app/use-cases/projections/GetProjectionDetailUseCase';
import { createMockProjectionRepository, createMockStudentRepository } from '../../utils/mockRepositories';
import { Projection, ProjectionPace, PaceCatalog, SubSubject, Category, GradeHistory } from '../../../core/domain/entities/deprecated';
import { TEST_CONSTANTS, createTestStudent } from '../../utils/testHelpers';

describe('GetProjectionDetailUseCase', () => {
  let useCase: GetProjectionDetailUseCase;
  let mockProjectionRepository: ReturnType<typeof createMockProjectionRepository>;
  let mockStudentRepository: ReturnType<typeof createMockStudentRepository>;

  beforeEach(() => {
    mockProjectionRepository = createMockProjectionRepository();
    mockStudentRepository = createMockStudentRepository();
    useCase = new GetProjectionDetailUseCase(mockProjectionRepository, mockStudentRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return projection detail with paces', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-05-31'),
      });

      const category = Category.create({
        id: 'category-1',
        name: 'Math',
        displayOrder: 1,
      });
      const subSubject = SubSubject.create({
        id: 'subsubject-1',
        name: 'Math L3',
        categoryId: category.id,
        levelId: 'level-1',
        difficulty: 3,
      });
      const paceCatalog = PaceCatalog.create({
        id: 'pace-catalog-1',
        code: '1001',
        name: 'Math 1001',
        subSubjectId: subSubject.id,
      });
      const projectionPace = new ProjectionPace(
        'projection-pace-1',
        TEST_CONSTANTS.PROJECTION_ID,
        'pace-catalog-1',
        'Q1',
        1,
        null,
        false,
        false
      );

      const student = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        firstName: 'John',
        lastName: 'Doe',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      const projectionWithPaces = {
        projection,
        projectionPaces: [
          {
            ...projectionPace,
            paceCatalog: {
              ...paceCatalog,
              subSubject: {
                ...subSubject,
                category,
              },
            },
            gradeHistory: [],
          },
        ],
        categories: [category],
      };

      vi.mocked(mockProjectionRepository.findByIdWithPaces).mockResolvedValue(projectionWithPaces as any);
      vi.mocked(mockStudentRepository.findById).mockResolvedValue(student);

      const result = await useCase.execute(TEST_CONSTANTS.PROJECTION_ID, TEST_CONSTANTS.STUDENT_ID);

      expect(result.id).toBe(TEST_CONSTANTS.PROJECTION_ID);
      expect(result.studentId).toBe(TEST_CONSTANTS.STUDENT_ID);
      expect(result.student.fullName).toBe('John Doe');
      expect(result.quarters.Q1).toBeDefined();
      expect(result.quarters.Q2).toBeDefined();
      expect(result.quarters.Q3).toBeDefined();
      expect(result.quarters.Q4).toBeDefined();
    });

    it('should throw error when projection not found', async () => {
      vi.mocked(mockProjectionRepository.findByIdWithPaces).mockResolvedValue(null);

      await expect(
        useCase.execute(TEST_CONSTANTS.PROJECTION_ID, TEST_CONSTANTS.STUDENT_ID)
      ).rejects.toThrow('Proyección no encontrada');
    });

    it('should throw error when student not found', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date(),
        endDate: new Date(),
      });

      const projectionWithPaces = {
        projection,
        projectionPaces: [],
        categories: [],
      };

      vi.mocked(mockProjectionRepository.findByIdWithPaces).mockResolvedValue(projectionWithPaces as any);
      vi.mocked(mockStudentRepository.findById).mockResolvedValue(null);

      await expect(
        useCase.execute(TEST_CONSTANTS.PROJECTION_ID, TEST_CONSTANTS.STUDENT_ID)
      ).rejects.toThrow('Estudiante no encontrado');
    });

    it('should organize paces by quarter and week', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date(),
        endDate: new Date(),
      });

      const category = Category.create({
        id: 'category-1',
        name: 'Math',
        displayOrder: 1,
      });
      const subSubject = SubSubject.create({
        id: 'subsubject-1',
        name: 'Math L3',
        categoryId: category.id,
        levelId: 'level-1',
        difficulty: 3,
      });
      const paceCatalog = PaceCatalog.create({
        id: 'pace-catalog-1',
        code: '1001',
        name: 'Math 1001',
        subSubjectId: subSubject.id,
      });

      const projectionPace1 = new ProjectionPace(
        'projection-pace-1',
        TEST_CONSTANTS.PROJECTION_ID,
        'pace-catalog-1',
        'Q1',
        1,
        null,
        false,
        false
      );

      const projectionPace2 = new ProjectionPace(
        'projection-pace-2',
        TEST_CONSTANTS.PROJECTION_ID,
        'pace-catalog-1',
        'Q1',
        2,
        null,
        false,
        false
      );

      const student = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        firstName: 'John',
        lastName: 'Doe',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      const projectionWithPaces = {
        projection,
        projectionPaces: [
          {
            ...projectionPace1,
            paceCatalog: {
              ...paceCatalog,
              subSubject: {
                ...subSubject,
                category,
              },
            },
            gradeHistory: [],
          },
          {
            ...projectionPace2,
            paceCatalog: {
              ...paceCatalog,
              subSubject: {
                ...subSubject,
                category,
              },
            },
            gradeHistory: [],
          },
        ],
        categories: [category],
      };

      vi.mocked(mockProjectionRepository.findByIdWithPaces).mockResolvedValue(projectionWithPaces as any);
      vi.mocked(mockStudentRepository.findById).mockResolvedValue(student);

      const result = await useCase.execute(TEST_CONSTANTS.PROJECTION_ID, TEST_CONSTANTS.STUDENT_ID);

      expect(result.quarters.Q1['Math L3'][0]).toBeDefined();
      expect(result.quarters.Q1['Math L3'][1]).toBeDefined();
    });

    it('should include grade history in pace output', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date(),
        endDate: new Date(),
      });

      const category = Category.create({
        id: 'category-1',
        name: 'Math',
        displayOrder: 1,
      });
      const subSubject = SubSubject.create({
        id: 'subsubject-1',
        name: 'Math L3',
        categoryId: category.id,
        levelId: 'level-1',
        difficulty: 3,
      });
      const paceCatalog = PaceCatalog.create({
        id: 'pace-catalog-1',
        code: '1001',
        name: 'Math 1001',
        subSubjectId: subSubject.id,
      });

      const gradeHistory = GradeHistory.create({
        id: 'history-1',
        paceId: 'projection-pace-1',
        grade: 85,
        date: new Date(),
        note: 'First attempt',
      });

      const projectionPace = new ProjectionPace(
        'projection-pace-1',
        TEST_CONSTANTS.PROJECTION_ID,
        'pace-catalog-1',
        'Q1',
        1,
        85,
        true,
        false
      );

      const student = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        firstName: 'John',
        lastName: 'Doe',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      const projectionWithPaces = {
        projection,
        projectionPaces: [
          {
            ...projectionPace,
            paceCatalog: {
              ...paceCatalog,
              subSubject: {
                ...subSubject,
                category,
              },
            },
            gradeHistory: [gradeHistory],
          },
        ],
        categories: [category],
      };

      vi.mocked(mockProjectionRepository.findByIdWithPaces).mockResolvedValue(projectionWithPaces as any);
      vi.mocked(mockStudentRepository.findById).mockResolvedValue(student);

      const result = await useCase.execute(TEST_CONSTANTS.PROJECTION_ID, TEST_CONSTANTS.STUDENT_ID);

      const pace = result.quarters.Q1['Math L3'][0];
      expect(pace?.gradeHistory).toBeDefined();
      expect(pace?.gradeHistory?.length).toBe(1);
      expect(pace?.gradeHistory?.[0].grade).toBe(85);
      expect(pace?.gradeHistory?.[0].note).toBe('First attempt');
    });
  });
});

