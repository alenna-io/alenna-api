import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteProjectionUseCase } from '../../../core/app/use-cases/projections/DeleteProjectionUseCase';
import { createMockProjectionRepository } from '../../utils/mockRepositories';
import { Projection } from '../../../core/domain/entities';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

describe('DeleteProjectionUseCase', () => {
  let useCase: DeleteProjectionUseCase;
  let mockRepository: ReturnType<typeof createMockProjectionRepository>;

  beforeEach(() => {
    mockRepository = createMockProjectionRepository();
    useCase = new DeleteProjectionUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should delete empty projection successfully', async () => {
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

      vi.mocked(mockRepository.findByIdWithPaces).mockResolvedValue(projectionWithPaces as any);
      vi.mocked(mockRepository.hardDelete).mockResolvedValue();

      await useCase.execute(TEST_CONSTANTS.PROJECTION_ID, TEST_CONSTANTS.STUDENT_ID);

      expect(mockRepository.hardDelete).toHaveBeenCalledWith(
        TEST_CONSTANTS.PROJECTION_ID,
        TEST_CONSTANTS.STUDENT_ID
      );
    });

    it('should throw error when projection not found', async () => {
      vi.mocked(mockRepository.findByIdWithPaces).mockResolvedValue(null);

      await expect(
        useCase.execute(TEST_CONSTANTS.PROJECTION_ID, TEST_CONSTANTS.STUDENT_ID)
      ).rejects.toThrow('Proyección no encontrada');
    });

    it('should throw error when projection has paces', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date(),
        endDate: new Date(),
      });

      const projectionWithPaces = {
        projection,
        projectionPaces: [
          {
            id: 'projection-pace-1',
            projectionId: TEST_CONSTANTS.PROJECTION_ID,
          },
        ],
        categories: [],
      };

      vi.mocked(mockRepository.findByIdWithPaces).mockResolvedValue(projectionWithPaces as any);

      await expect(
        useCase.execute(TEST_CONSTANTS.PROJECTION_ID, TEST_CONSTANTS.STUDENT_ID)
      ).rejects.toThrow('No se puede eliminar una proyección con lecciones');
    });

    it('should allow deletion when projection has no paces', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date(),
        endDate: new Date(),
      });

      const projectionWithPaces = {
        projection,
        projectionPaces: null,
        categories: [],
      };

      vi.mocked(mockRepository.findByIdWithPaces).mockResolvedValue(projectionWithPaces as any);
      vi.mocked(mockRepository.hardDelete).mockResolvedValue();

      await useCase.execute(TEST_CONSTANTS.PROJECTION_ID, TEST_CONSTANTS.STUDENT_ID);

      expect(mockRepository.hardDelete).toHaveBeenCalled();
    });
  });
});

