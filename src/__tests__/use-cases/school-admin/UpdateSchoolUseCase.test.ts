import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateSchoolUseCase } from '../../../core/app/use-cases/schools/UpdateSchoolUseCase';
import { createMockSchoolRepository } from '../../utils/mockRepositories';
import { School } from '../../../core/domain/entities/deprecated';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

describe('UpdateSchoolUseCase', () => {
  let useCase: UpdateSchoolUseCase;
  let mockRepository: ReturnType<typeof createMockSchoolRepository>;

  beforeEach(() => {
    mockRepository = createMockSchoolRepository();
    useCase = new UpdateSchoolUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should update school when found', async () => {
      // Arrange
      const existingSchool = School.create({
        id: TEST_CONSTANTS.SCHOOL_ID,
        name: 'Test School',
        address: '123 Main St',
        phone: '555-1234',
        email: 'test@school.com',
        teacherLimit: 10,
        userLimit: 100,
        isActive: true,
      });

      const updatedSchool = School.create({
        id: TEST_CONSTANTS.SCHOOL_ID,
        name: 'Updated School',
        address: '456 New St',
        phone: '555-5678',
        email: 'updated@school.com',
        teacherLimit: 10,
        userLimit: 100,
        isActive: true,
      });

      const updateInput = {
        name: 'Updated School',
        address: '456 New St',
        phone: '555-5678',
        email: 'updated@school.com',
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(existingSchool);
      vi.mocked(mockRepository.update).mockResolvedValue(updatedSchool);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, updateInput);

      // Assert
      expect(result).toEqual(updatedSchool);
      expect(mockRepository.findById).toHaveBeenCalledWith(TEST_CONSTANTS.SCHOOL_ID);
      expect(mockRepository.update).toHaveBeenCalledWith(TEST_CONSTANTS.SCHOOL_ID, updateInput);
    });

    it('should throw error when school not found', async () => {
      // Arrange
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      const updateInput = {
        name: 'Updated School',
      };

      // Act & Assert
      await expect(useCase.execute(TEST_CONSTANTS.SCHOOL_ID, updateInput)).rejects.toThrow('School not found');
      expect(mockRepository.findById).toHaveBeenCalledWith(TEST_CONSTANTS.SCHOOL_ID);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });
});

