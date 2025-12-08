import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarkPaceIncompleteUseCase } from '../../../core/app/use-cases/projections/MarkPaceIncompleteUseCase';
import { createMockProjectionRepository } from '../../utils/mockRepositories';
import { Projection } from '../../../core/domain/entities';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      projectionPace: {
        findFirst: vi.fn(),
        update: vi.fn(),
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

describe('MarkPaceIncompleteUseCase', () => {
  let useCase: MarkPaceIncompleteUseCase;
  let mockRepository: ReturnType<typeof createMockProjectionRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    mockRepository = createMockProjectionRepository();
    useCase = new MarkPaceIncompleteUseCase(mockRepository);
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should mark PACE as incomplete successfully', async () => {
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
        grade: 85,
        isCompleted: true,
        isFailed: false,
        comments: 'Previous comment',
        deletedAt: null,
      };

      const updatedPace = {
        ...projectionPace,
        grade: null,
        isCompleted: false,
        isFailed: false,
        comments: null,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(projection);
      mockPrisma.projectionPace.findFirst.mockResolvedValue(projectionPace);
      mockPrisma.projectionPace.update.mockResolvedValue(updatedPace);

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        'projection-pace-1',
        TEST_CONSTANTS.STUDENT_ID
      );

      expect(result.grade).toBeNull();
      expect(result.isCompleted).toBe(false);
      expect(result.isFailed).toBe(false);
      expect(mockPrisma.projectionPace.update).toHaveBeenCalledWith({
        where: { id: 'projection-pace-1' },
        data: {
          grade: null,
          isCompleted: false,
          isFailed: false,
          comments: null,
        },
      });
    });

    it('should throw error when projection not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.PROJECTION_ID,
          'projection-pace-1',
          TEST_CONSTANTS.STUDENT_ID
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
          TEST_CONSTANTS.STUDENT_ID
        )
      ).rejects.toThrow('PACE no encontrado en la proyección');
    });

    it('should reset all grade-related fields', async () => {
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
        grade: 75,
        isCompleted: false,
        isFailed: true,
        comments: 'Needs improvement',
        deletedAt: null,
      };

      const updatedPace = {
        ...projectionPace,
        grade: null,
        isCompleted: false,
        isFailed: false,
        comments: null,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(projection);
      mockPrisma.projectionPace.findFirst.mockResolvedValue(projectionPace);
      mockPrisma.projectionPace.update.mockResolvedValue(updatedPace);

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        'projection-pace-1',
        TEST_CONSTANTS.STUDENT_ID
      );

      expect(result.grade).toBeNull();
      expect(result.isCompleted).toBe(false);
      expect(result.isFailed).toBe(false);
      expect(result.comments).toBeUndefined();
    });
  });
});

