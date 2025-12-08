import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetCurrentUserUseCase } from '../../../core/app/use-cases/auth/GetCurrentUserUseCase';
import { createMockUserRepository } from '../../utils/mockRepositories';
import { createTestUser, TEST_CONSTANTS } from '../../utils/testHelpers';

describe('GetCurrentUserUseCase', () => {
  let useCase: GetCurrentUserUseCase;
  let mockRepository: ReturnType<typeof createMockUserRepository>;

  beforeEach(() => {
    mockRepository = createMockUserRepository();
    useCase = new GetCurrentUserUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return user when found', async () => {
      // Arrange
      const testUser = createTestUser({
        id: TEST_CONSTANTS.USER_ID,
        email: 'test@example.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(testUser);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.USER_ID);

      // Assert
      expect(result).toEqual(testUser);
      expect(mockRepository.findById).toHaveBeenCalledWith(TEST_CONSTANTS.USER_ID);
    });

    it('should throw error when user not found', async () => {
      // Arrange
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(TEST_CONSTANTS.USER_ID)).rejects.toThrow('User not found');

      expect(mockRepository.findById).toHaveBeenCalledWith(TEST_CONSTANTS.USER_ID);
    });
  });
});

