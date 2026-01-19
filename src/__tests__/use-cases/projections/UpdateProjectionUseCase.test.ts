import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateProjectionUseCase } from '../../../core/app/use-cases/projections/UpdateProjectionUseCase';
import { createMockProjectionRepository } from '../../utils/mockRepositories';
import { Projection } from '../../../core/domain/entities/deprecated';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

describe('UpdateProjectionUseCase', () => {
  let useCase: UpdateProjectionUseCase;
  let mockRepository: ReturnType<typeof createMockProjectionRepository>;

  beforeEach(() => {
    mockRepository = createMockProjectionRepository();
    useCase = new UpdateProjectionUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should update projection successfully', async () => {
      const existingProjection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-05-31'),
        isActive: true,
      });

      const updatedProjection = existingProjection.update({
        isActive: false,
        notes: 'Updated notes',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(existingProjection);
      vi.mocked(mockRepository.update).mockResolvedValue(updatedProjection);

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        {
          isActive: false,
          notes: 'Updated notes',
        },
        TEST_CONSTANTS.STUDENT_ID
      );

      expect(result.isActive).toBe(false);
      expect(mockRepository.update).toHaveBeenCalledWith(
        TEST_CONSTANTS.PROJECTION_ID,
        expect.objectContaining({
          isActive: false,
          notes: 'Updated notes',
        }),
        TEST_CONSTANTS.STUDENT_ID
      );
    });

    it('should throw error when projection not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.PROJECTION_ID,
          { isActive: false },
          TEST_CONSTANTS.STUDENT_ID
        )
      ).rejects.toThrow('Projection not found');
    });

    it('should update dates when provided', async () => {
      const existingProjection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-05-31'),
      });

      const updatedProjection = existingProjection.update({
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-06-30'),
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(existingProjection);
      vi.mocked(mockRepository.update).mockResolvedValue(updatedProjection);

      await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        {
          startDate: '2024-09-01',
          endDate: '2025-06-30',
        },
        TEST_CONSTANTS.STUDENT_ID
      );

      expect(mockRepository.update).toHaveBeenCalledWith(
        TEST_CONSTANTS.PROJECTION_ID,
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        }),
        TEST_CONSTANTS.STUDENT_ID
      );
    });

    it('should update school year when provided', async () => {
      const existingProjection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date(),
        endDate: new Date(),
      });

      const updatedProjection = existingProjection.update({
        schoolYear: '2025-2026',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(existingProjection);
      vi.mocked(mockRepository.update).mockResolvedValue(updatedProjection);

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        {
          schoolYear: '2025-2026',
        },
        TEST_CONSTANTS.STUDENT_ID
      );

      expect(result.schoolYear).toBe('2025-2026');
    });
  });
});

