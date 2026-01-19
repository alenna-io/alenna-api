import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetSchoolUseCase } from '../../../core/app/use-cases/schools/GetSchoolUseCase';
import { createMockSchoolRepository } from '../../utils/mockRepositories';
import { School } from '../../../core/domain/entities/deprecated';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

describe('GetSchoolUseCase', () => {
  let useCase: GetSchoolUseCase;
  let mockRepository: ReturnType<typeof createMockSchoolRepository>;

  beforeEach(() => {
    mockRepository = createMockSchoolRepository();
    useCase = new GetSchoolUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return school when found', async () => {
      // Arrange
      const school = School.create({
        id: TEST_CONSTANTS.SCHOOL_ID,
        name: 'Test School',
        address: '123 Main St',
        phone: '555-1234',
        email: 'test@school.com',
        teacherLimit: 10,
        userLimit: 100,
        isActive: true,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(school);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result).toEqual(school);
      expect(mockRepository.findById).toHaveBeenCalledWith(TEST_CONSTANTS.SCHOOL_ID);
    });

    it('should throw error when school not found', async () => {
      // Arrange
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(TEST_CONSTANTS.SCHOOL_ID)).rejects.toThrow('School not found');
      expect(mockRepository.findById).toHaveBeenCalledWith(TEST_CONSTANTS.SCHOOL_ID);
    });
  });
});

