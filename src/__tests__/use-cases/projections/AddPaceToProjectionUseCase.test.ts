import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddPaceToProjectionUseCase } from '../../../core/app/use-cases/projections/AddPaceToProjectionUseCase';
import { createMockProjectionRepository } from '../../utils/mockRepositories';
import { Projection } from '../../../core/domain/entities';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      paceCatalog: {
        findUnique: vi.fn(),
      },
      projectionPace: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      projectionCategory: {
        upsert: vi.fn(),
      },
    },
  };
});

vi.mock('../../../core/frameworks/database/prisma.client', () => {
  return {
    default: mockPrismaInstance,
  };
});

describe('AddPaceToProjectionUseCase', () => {
  let useCase: AddPaceToProjectionUseCase;
  let mockRepository: ReturnType<typeof createMockProjectionRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    mockRepository = createMockProjectionRepository();
    useCase = new AddPaceToProjectionUseCase(mockRepository);
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should add PACE to projection successfully', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-05-31'),
      });

      const paceCatalog = {
        id: 'pace-catalog-1',
        code: 'MATH-001',
      };

      const paceCatalogWithDetails = {
        id: 'pace-catalog-1',
        code: 'MATH-001',
        subSubject: {
          category: {
            id: 'category-1',
            name: 'Math',
          },
        },
      };

      const createdPace = {
        id: 'projection-pace-1',
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        paceCatalogId: 'pace-catalog-1',
        quarter: 'Q1',
        week: 1,
        grade: null,
        isCompleted: false,
        isFailed: false,
        comments: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(projection);
      mockPrisma.paceCatalog.findUnique
        .mockResolvedValueOnce(paceCatalog)
        .mockResolvedValueOnce(paceCatalogWithDetails);
      mockPrisma.projectionPace.findUnique.mockResolvedValue(null);
      mockPrisma.projectionPace.findFirst.mockResolvedValue(null);
      mockPrisma.projectionPace.create.mockResolvedValue(createdPace);
      mockPrisma.projectionCategory.upsert.mockResolvedValue({});

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        TEST_CONSTANTS.STUDENT_ID,
        'pace-catalog-1',
        'Q1',
        1
      );

      expect(result.id).toBe('projection-pace-1');
      expect(result.quarter).toBe('Q1');
      expect(result.week).toBe(1);
      expect(mockPrisma.projectionPace.create).toHaveBeenCalled();
      expect(mockPrisma.projectionCategory.upsert).toHaveBeenCalled();
    });

    it('should throw error when projection not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.PROJECTION_ID,
          TEST_CONSTANTS.STUDENT_ID,
          'pace-catalog-1',
          'Q1',
          1
        )
      ).rejects.toThrow('Proyección no encontrada');
    });

    it('should throw error when PACE catalog not found', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-05-31'),
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(projection);
      mockPrisma.paceCatalog.findUnique.mockResolvedValue(null);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.PROJECTION_ID,
          TEST_CONSTANTS.STUDENT_ID,
          'pace-catalog-1',
          'Q1',
          1
        )
      ).rejects.toThrow('PACE no encontrado en el catálogo');
    });

    it('should throw error when PACE already exists in projection', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-05-31'),
      });

      const paceCatalog = {
        id: 'pace-catalog-1',
        code: 'MATH-001',
      };

      const existingPace = {
        id: 'projection-pace-1',
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        paceCatalogId: 'pace-catalog-1',
        deletedAt: null,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(projection);
      mockPrisma.paceCatalog.findUnique.mockResolvedValue(paceCatalog);
      mockPrisma.projectionPace.findUnique.mockResolvedValue(existingPace);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.PROJECTION_ID,
          TEST_CONSTANTS.STUDENT_ID,
          'pace-catalog-1',
          'Q1',
          1
        )
      ).rejects.toThrow('Este PACE ya está agregado a la proyección');
    });

    it('should throw error when category conflict exists at position', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-05-31'),
      });

      const paceCatalog = {
        id: 'pace-catalog-1',
        code: 'MATH-001',
      };

      const paceCatalogWithDetails = {
        id: 'pace-catalog-1',
        code: 'MATH-001',
        subSubject: {
          category: {
            id: 'category-1',
            name: 'Math',
          },
        },
      };

      const existingPaceAtPosition = {
        id: 'projection-pace-2',
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        quarter: 'Q1',
        week: 1,
        deletedAt: null,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(projection);
      mockPrisma.paceCatalog.findUnique
        .mockResolvedValueOnce(paceCatalog)
        .mockResolvedValueOnce(paceCatalogWithDetails);
      mockPrisma.projectionPace.findUnique.mockResolvedValue(null);
      mockPrisma.projectionPace.findFirst.mockResolvedValue(existingPaceAtPosition);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.PROJECTION_ID,
          TEST_CONSTANTS.STUDENT_ID,
          'pace-catalog-1',
          'Q1',
          1
        )
      ).rejects.toThrow('Ya existe un PACE de Math en Q1 Semana 1');
    });

    it('should restore soft-deleted PACE when re-adding', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-05-31'),
      });

      const paceCatalog = {
        id: 'pace-catalog-1',
        code: 'MATH-001',
      };

      const paceCatalogWithDetails = {
        id: 'pace-catalog-1',
        code: 'MATH-001',
        subSubject: {
          category: {
            id: 'category-1',
            name: 'Math',
          },
        },
      };

      const softDeletedPace = {
        id: 'projection-pace-1',
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        paceCatalogId: 'pace-catalog-1',
        deletedAt: new Date(),
      };

      const restoredPace = {
        id: 'projection-pace-1',
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        paceCatalogId: 'pace-catalog-1',
        quarter: 'Q1',
        week: 1,
        grade: null,
        isCompleted: false,
        isFailed: false,
        comments: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(projection);
      mockPrisma.paceCatalog.findUnique
        .mockResolvedValueOnce(paceCatalog)
        .mockResolvedValueOnce(paceCatalogWithDetails);
      mockPrisma.projectionPace.findUnique.mockResolvedValue(softDeletedPace);
      mockPrisma.projectionPace.findFirst.mockResolvedValue(null);
      mockPrisma.projectionPace.update.mockResolvedValue(restoredPace);
      mockPrisma.projectionCategory.upsert.mockResolvedValue({});

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        TEST_CONSTANTS.STUDENT_ID,
        'pace-catalog-1',
        'Q1',
        1
      );

      expect(result.id).toBe('projection-pace-1');
      expect(mockPrisma.projectionPace.update).toHaveBeenCalledWith({
        where: { id: 'projection-pace-1' },
        data: {
          quarter: 'Q1',
          week: 1,
          deletedAt: null,
          grade: null,
          isCompleted: false,
          isFailed: false,
          comments: null,
        },
      });
    });
  });
});

