import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateProjectionUseCase } from '../../../core/app/use-cases/projections/GenerateProjectionUseCase';
import { createMockProjectionRepository } from '../../utils/mockRepositories';
import { Projection } from '../../../core/domain/entities';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      paceCatalog: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
      },
      subSubject: {
        findUnique: vi.fn(),
      },
      projectionPace: {
        findUnique: vi.fn(),
        createMany: vi.fn(),
      },
      projectionCategory: {
        createMany: vi.fn(),
      },
    },
  };
});

vi.mock('../../../core/frameworks/database/prisma.client', () => {
  return {
    default: mockPrismaInstance,
  };
});

describe('GenerateProjectionUseCase', () => {
  let useCase: GenerateProjectionUseCase;
  let mockRepository: ReturnType<typeof createMockProjectionRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    mockRepository = createMockProjectionRepository();
    useCase = new GenerateProjectionUseCase(mockRepository);
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('execute', () => {
    it('should generate projection successfully', async () => {
      const subjects = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1001,
          endPace: 1003,
          skipPaces: [],
          notPairWith: [],
        },
      ];

      const createdProjection = Projection.create({
        id: 'projection-1',
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date(),
        endDate: new Date(),
      });

      const paceCatalog = {
        id: 'pace-catalog-1',
        code: '1001',
        subSubjectId: 'math-1',
        subSubject: {
          category: {
            id: 'category-1',
          },
        },
      };

      vi.mocked(mockRepository.findActiveByStudentId).mockResolvedValue(null);
      vi.mocked(mockRepository.findByStudentIdAndSchoolYear).mockResolvedValue(null);
      vi.mocked(mockRepository.create).mockResolvedValue(createdProjection);
      mockPrisma.paceCatalog.findFirst.mockResolvedValue(paceCatalog);
      mockPrisma.projectionPace.findUnique.mockResolvedValue(null);
      mockPrisma.projectionPace.createMany.mockResolvedValue({ count: 3 });
      mockPrisma.projectionCategory.createMany.mockResolvedValue({ count: 1 });

      const result = await useCase.execute({
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        subjects,
      });

      expect(result.id).toBe('projection-1');
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockPrisma.projectionPace.createMany).toHaveBeenCalled();
    });

    it('should throw error when student has active projection', async () => {
      const activeProjection = Projection.create({
        id: 'projection-1',
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date(),
        endDate: new Date(),
      });

      vi.mocked(mockRepository.findActiveByStudentId).mockResolvedValue(activeProjection);

      await expect(
        useCase.execute({
          studentId: TEST_CONSTANTS.STUDENT_ID,
          schoolYear: '2024-2025',
          subjects: [],
        })
      ).rejects.toThrow('El estudiante ya tiene una proyección activa');
    });

    it('should throw error when projection exists for same school year', async () => {
      const existingProjection = Projection.create({
        id: 'projection-1',
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date(),
        endDate: new Date(),
      });

      vi.mocked(mockRepository.findActiveByStudentId).mockResolvedValue(null);
      vi.mocked(mockRepository.findByStudentIdAndSchoolYear).mockResolvedValue(existingProjection);

      await expect(
        useCase.execute({
          studentId: TEST_CONSTANTS.STUDENT_ID,
          schoolYear: '2024-2025',
          subjects: [],
        })
      ).rejects.toThrow('Ya existe una proyección para este estudiante en el año escolar');
    });

    it('should create projection with correct dates', async () => {
      const subjects = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1001,
          endPace: 1003,
          skipPaces: [],
          notPairWith: [],
        },
      ];

      const createdProjection = Projection.create({
        id: 'projection-1',
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-05-31'),
      });

      vi.mocked(mockRepository.findActiveByStudentId).mockResolvedValue(null);
      vi.mocked(mockRepository.findByStudentIdAndSchoolYear).mockResolvedValue(null);
      vi.mocked(mockRepository.create).mockResolvedValue(createdProjection);
      mockPrisma.paceCatalog.findFirst.mockResolvedValue({
        id: 'pace-catalog-1',
        code: '1001',
        subSubject: { category: { id: 'category-1' } },
      });
      mockPrisma.projectionPace.findUnique.mockResolvedValue(null);
      mockPrisma.projectionPace.createMany.mockResolvedValue({ count: 0 });
      mockPrisma.projectionCategory.createMany.mockResolvedValue({ count: 0 });

      await useCase.execute({
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        subjects,
      });

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          schoolYear: '2024-2025',
          isActive: true,
        })
      );
    });

    it('should track categories used in projection', async () => {
      const subjects = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1001,
          endPace: 1003,
          skipPaces: [],
          notPairWith: [],
        },
      ];

      const createdProjection = Projection.create({
        id: 'projection-1',
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date(),
        endDate: new Date(),
      });

      const paceCatalog = {
        id: 'pace-catalog-1',
        code: '1001',
        subSubject: {
          category: {
            id: 'category-1',
          },
        },
      };

      vi.mocked(mockRepository.findActiveByStudentId).mockResolvedValue(null);
      vi.mocked(mockRepository.findByStudentIdAndSchoolYear).mockResolvedValue(null);
      vi.mocked(mockRepository.create).mockResolvedValue(createdProjection);
      mockPrisma.paceCatalog.findFirst.mockResolvedValue(paceCatalog);
      mockPrisma.paceCatalog.findUnique.mockResolvedValue(paceCatalog);
      mockPrisma.projectionPace.findUnique.mockResolvedValue(null);
      mockPrisma.projectionPace.createMany.mockResolvedValue({ count: 3 });
      mockPrisma.projectionCategory.createMany.mockResolvedValue({ count: 1 });

      await useCase.execute({
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        subjects,
      });

      expect(mockPrisma.projectionCategory.createMany).toHaveBeenCalled();
    });
  });
});

