import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RemovePaceFromProjectionUseCase } from '../../../core/app/use-cases/projections/RemovePaceFromProjectionUseCase';
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

describe('RemovePaceFromProjectionUseCase', () => {
  let useCase: RemovePaceFromProjectionUseCase;
  let mockRepository: ReturnType<typeof createMockProjectionRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    mockRepository = createMockProjectionRepository();
    useCase = new RemovePaceFromProjectionUseCase(mockRepository);
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should remove PACE from projection successfully', async () => {
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
        deletedAt: null,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(projection);
      mockPrisma.projectionPace.findFirst.mockResolvedValue(projectionPace);
      mockPrisma.projectionPace.update.mockResolvedValue({
        ...projectionPace,
        deletedAt: new Date(),
      });

      await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        'projection-pace-1',
        TEST_CONSTANTS.STUDENT_ID
      );

      expect(mockPrisma.projectionPace.update).toHaveBeenCalledWith({
        where: { id: 'projection-pace-1' },
        data: { deletedAt: expect.any(Date) },
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

    it('should throw error when projection pace belongs to different projection', async () => {
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
  });
});

