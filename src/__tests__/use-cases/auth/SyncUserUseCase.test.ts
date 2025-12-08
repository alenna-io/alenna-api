import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncUserUseCase } from '../../../core/app/use-cases/auth/SyncUserUseCase';
import { createMockUserRepository } from '../../utils/mockRepositories';
import { createTestUser, TEST_CONSTANTS } from '../../utils/testHelpers';

describe('SyncUserUseCase', () => {
  let useCase: SyncUserUseCase;
  let mockRepository: ReturnType<typeof createMockUserRepository>;

  beforeEach(() => {
    mockRepository = createMockUserRepository();
    useCase = new SyncUserUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return user when found by clerkId', async () => {
      // Arrange
      const testUser = createTestUser({
        id: TEST_CONSTANTS.USER_ID,
        clerkId: TEST_CONSTANTS.CLERK_ID,
        email: 'test@example.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      vi.mocked(mockRepository.findByClerkId).mockResolvedValue(testUser);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.CLERK_ID);

      // Assert
      expect(result).toEqual(testUser);
      expect(mockRepository.findByClerkId).toHaveBeenCalledWith(TEST_CONSTANTS.CLERK_ID);
    });

    it('should throw error when user not found', async () => {
      // Arrange
      vi.mocked(mockRepository.findByClerkId).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(TEST_CONSTANTS.CLERK_ID)).rejects.toThrow(
        'User not found. Please contact your administrator to create your account.'
      );

      expect(mockRepository.findByClerkId).toHaveBeenCalledWith(TEST_CONSTANTS.CLERK_ID);
    });

    it('should handle empty clerkId', async () => {
      // Arrange
      vi.mocked(mockRepository.findByClerkId).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute('')).rejects.toThrow(
        'User not found. Please contact your administrator to create your account.'
      );
    });
  });
});

