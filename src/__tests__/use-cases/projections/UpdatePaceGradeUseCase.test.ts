import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdatePaceGradeUseCase } from '../../../core/app/use-cases/projections/UpdatePaceGradeUseCase';
import { createMockProjectionRepository } from '../../utils/mockRepositories';
import { Projection } from '../../../core/domain/entities/deprecated';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      projectionPace: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      projection: {
        findFirst: vi.fn(),
      },
      quarter: {
        findFirst: vi.fn(),
      },
      schoolYear: {
        findFirst: vi.fn(),
      },
      gradeHistory: {
        create: vi.fn(),
      },
    },
  };
});

vi.mock('../../../core/frameworks/database/prisma.client', () => {
  return {
    default: mockPrismaInstance,
  };
});

vi.mock('../../../core/frameworks/database/mappers', () => {
  return {
    ProjectionPaceMapper: {
      toDomain: vi.fn((pace) => ({
        id: pace.id,
        projectionId: pace.projectionId,
        paceCatalogId: pace.paceCatalogId,
        quarter: pace.quarter,
        week: pace.week,
        grade: pace.grade,
        isCompleted: pace.isCompleted,
        isFailed: pace.isFailed,
        comments: pace.comments ?? undefined,
      })),
    },
  };
});

describe('UpdatePaceGradeUseCase', () => {
  let useCase: UpdatePaceGradeUseCase;
  let mockRepository: ReturnType<typeof createMockProjectionRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    mockRepository = createMockProjectionRepository();
    useCase = new UpdatePaceGradeUseCase(mockRepository);
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should update PACE grade successfully', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-05-31'),
      });

      const projectionPace = {
        id: 'projection-pace-1',
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        grade: null,
        isCompleted: false,
        isFailed: false,
        comments: null,
        deletedAt: null,
      };

      const updatedPace = {
        ...projectionPace,
        grade: 85,
        isCompleted: true,
        isFailed: false,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(projection);
      mockPrisma.projectionPace.findFirst.mockResolvedValue(projectionPace);
      mockPrisma.projectionPace.update.mockResolvedValue(updatedPace);
      mockPrisma.gradeHistory.create.mockResolvedValue({});

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        'projection-pace-1',
        TEST_CONSTANTS.STUDENT_ID,
        85
      );

      expect(result.grade).toBe(85);
      expect(result.isCompleted).toBe(true);
      expect(mockPrisma.projectionPace.update).toHaveBeenCalledWith({
        where: { id: 'projection-pace-1' },
        data: {
          grade: 85,
          isCompleted: true,
          isFailed: false,
          comments: null,
        },
      });
      expect(mockPrisma.gradeHistory.create).toHaveBeenCalled();
    });

    it('should mark as completed when grade >= 80', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-05-31'),
      });

      const projectionPace = {
        id: 'projection-pace-1',
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        grade: null,
        isCompleted: false,
        isFailed: false,
        comments: null,
        deletedAt: null,
      };

      const updatedPace = {
        ...projectionPace,
        grade: 80,
        isCompleted: true,
        isFailed: false,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(projection);
      mockPrisma.projectionPace.findFirst.mockResolvedValue(projectionPace);
      mockPrisma.projectionPace.update.mockResolvedValue(updatedPace);
      mockPrisma.gradeHistory.create.mockResolvedValue({});

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        'projection-pace-1',
        TEST_CONSTANTS.STUDENT_ID,
        80
      );

      expect(result.isCompleted).toBe(true);
      expect(result.isFailed).toBe(false);
    });

    it('should mark as failed when grade < 80', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-05-31'),
      });

      const projectionPace = {
        id: 'projection-pace-1',
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        grade: null,
        isCompleted: false,
        isFailed: false,
        comments: null,
        deletedAt: null,
      };

      const updatedPace = {
        ...projectionPace,
        grade: 75,
        isCompleted: false,
        isFailed: true,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(projection);
      mockPrisma.projectionPace.findFirst.mockResolvedValue(projectionPace);
      mockPrisma.projectionPace.update.mockResolvedValue(updatedPace);
      mockPrisma.gradeHistory.create.mockResolvedValue({});

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        'projection-pace-1',
        TEST_CONSTANTS.STUDENT_ID,
        75
      );

      expect(result.isCompleted).toBe(false);
      expect(result.isFailed).toBe(true);
    });

    it('should allow manual override of completion status', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-05-31'),
      });

      const projectionPace = {
        id: 'projection-pace-1',
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        grade: null,
        isCompleted: false,
        isFailed: false,
        comments: null,
        deletedAt: null,
      };

      const updatedPace = {
        ...projectionPace,
        grade: 75,
        isCompleted: true,
        isFailed: false,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(projection);
      mockPrisma.projectionPace.findFirst.mockResolvedValue(projectionPace);
      mockPrisma.projectionPace.update.mockResolvedValue(updatedPace);
      mockPrisma.gradeHistory.create.mockResolvedValue({});

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        'projection-pace-1',
        TEST_CONSTANTS.STUDENT_ID,
        75,
        true,
        false
      );

      expect(result.isCompleted).toBe(true);
      expect(result.isFailed).toBe(false);
    });

    it('should update comments when provided', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-05-31'),
      });

      const projectionPace = {
        id: 'projection-pace-1',
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        grade: null,
        isCompleted: false,
        isFailed: false,
        comments: null,
        deletedAt: null,
      };

      const updatedPace = {
        ...projectionPace,
        grade: 85,
        isCompleted: true,
        isFailed: false,
        comments: 'Great work!',
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(projection);
      mockPrisma.projectionPace.findFirst.mockResolvedValue(projectionPace);
      mockPrisma.projectionPace.update.mockResolvedValue(updatedPace);
      mockPrisma.gradeHistory.create.mockResolvedValue({});

      await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        'projection-pace-1',
        TEST_CONSTANTS.STUDENT_ID,
        85,
        undefined,
        undefined,
        'Great work!'
      );

      expect(mockPrisma.projectionPace.update).toHaveBeenCalledWith({
        where: { id: 'projection-pace-1' },
        data: {
          grade: 85,
          isCompleted: true,
          isFailed: false,
          comments: 'Great work!',
        },
      });
    });

    it('should add note to grade history', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-05-31'),
      });

      const projectionPace = {
        id: 'projection-pace-1',
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        grade: null,
        isCompleted: false,
        isFailed: false,
        comments: null,
        deletedAt: null,
      };

      const updatedPace = {
        ...projectionPace,
        grade: 85,
        isCompleted: true,
        isFailed: false,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(projection);
      mockPrisma.projectionPace.findFirst.mockResolvedValue(projectionPace);
      mockPrisma.projectionPace.update.mockResolvedValue(updatedPace);
      mockPrisma.gradeHistory.create.mockResolvedValue({});

      await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        'projection-pace-1',
        TEST_CONSTANTS.STUDENT_ID,
        85,
        undefined,
        undefined,
        undefined,
        'Retake after improvement'
      );

      expect(mockPrisma.gradeHistory.create).toHaveBeenCalledWith({
        data: {
          id: expect.any(String),
          projectionPaceId: 'projection-pace-1',
          grade: 85,
          date: expect.any(Date),
          note: 'Retake after improvement',
        },
      });
    });

    it('should throw error when projection not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.PROJECTION_ID,
          'projection-pace-1',
          TEST_CONSTANTS.STUDENT_ID,
          85
        )
      ).rejects.toThrow('Proyección no encontrada');
    });

    it('should throw error when projection pace not found', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-05-31'),
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(projection);
      mockPrisma.projectionPace.findFirst.mockResolvedValue(null);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.PROJECTION_ID,
          'projection-pace-1',
          TEST_CONSTANTS.STUDENT_ID,
          85
        )
      ).rejects.toThrow('PACE no encontrado en la proyección');
    });

    it('should throw error when trying to edit grade in closed quarter', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-05-31'),
      });

      const projectionPace = {
        id: 'projection-pace-1',
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        quarter: 'Q1',
        grade: null,
        isCompleted: false,
        isFailed: false,
        comments: null,
        deletedAt: null,
      };

      const projectionWithStudent = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        student: {
          schoolId: 'school-1',
        },
      };

      const schoolYear = {
        id: 'school-year-1',
        schoolId: 'school-1',
        name: '2024-2025',
        deletedAt: null,
      };

      const quarter = {
        id: 'quarter-1',
        schoolYearId: 'school-year-1',
        name: 'Q1',
        isClosed: true,
        deletedAt: null,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(projection);
      mockPrisma.projectionPace.findFirst.mockResolvedValue(projectionPace);
      mockPrisma.projection.findFirst.mockResolvedValue(projectionWithStudent);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.quarter.findFirst.mockResolvedValue(quarter);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.PROJECTION_ID,
          'projection-pace-1',
          TEST_CONSTANTS.STUDENT_ID,
          85
        )
      ).rejects.toThrow('Cannot edit grades for closed quarter');
    });

    it('should allow editing grade in open quarter', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-05-31'),
      });

      const projectionPace = {
        id: 'projection-pace-1',
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        quarter: 'Q1',
        grade: null,
        isCompleted: false,
        isFailed: false,
        comments: null,
        deletedAt: null,
      };

      const projectionWithStudent = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        student: {
          schoolId: 'school-1',
        },
      };

      const schoolYear = {
        id: 'school-year-1',
        schoolId: 'school-1',
        name: '2024-2025',
        deletedAt: null,
      };

      const quarter = {
        id: 'quarter-1',
        schoolYearId: 'school-year-1',
        name: 'Q1',
        isClosed: false,
        deletedAt: null,
      };

      const updatedPace = {
        ...projectionPace,
        grade: 85,
        isCompleted: true,
        isFailed: false,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(projection);
      mockPrisma.projectionPace.findFirst.mockResolvedValue(projectionPace);
      mockPrisma.projection.findFirst.mockResolvedValue(projectionWithStudent);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.quarter.findFirst.mockResolvedValue(quarter);
      mockPrisma.projectionPace.update.mockResolvedValue(updatedPace);
      mockPrisma.gradeHistory.create.mockResolvedValue({});

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        'projection-pace-1',
        TEST_CONSTANTS.STUDENT_ID,
        85
      );

      expect(result.grade).toBe(85);
      expect(mockPrisma.projectionPace.update).toHaveBeenCalled();
    });
  });
});

