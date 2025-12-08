import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncUserUseCase } from '../../../core/app/use-cases/auth/SyncUserUseCase';
import { createMockUserRepository } from '../../utils/mockRepositories';
import { createTestUser, TEST_CONSTANTS } from '../../utils/testHelpers';

// Mock Prisma Client
const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      user: {
        findUnique: vi.fn(),
      },
    },
  };
});

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      constructor() {
        return mockPrismaInstance;
      }
    },
  };
});

describe('SyncUserUseCase', () => {
  let useCase: SyncUserUseCase;
  let mockRepository: ReturnType<typeof createMockUserRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    mockRepository = createMockUserRepository();
    useCase = new SyncUserUseCase(mockRepository);
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return user when found by clerkId and user is active', async () => {
      // Arrange
      const testUser = createTestUser({
        id: TEST_CONSTANTS.USER_ID,
        clerkId: TEST_CONSTANTS.CLERK_ID,
        email: 'test@example.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
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

    it('should throw error when user is inactive', async () => {
      // Arrange
      const inactiveUser = createTestUser({
        id: TEST_CONSTANTS.USER_ID,
        clerkId: TEST_CONSTANTS.CLERK_ID,
        email: 'test@example.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: false,
      });

      vi.mocked(mockRepository.findByClerkId).mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(useCase.execute(TEST_CONSTANTS.CLERK_ID)).rejects.toThrow(
        'Your account has been deactivated. Please contact your administrator.'
      );
    });

    it('should throw error when user is deleted', async () => {
      // Arrange
      const deletedUser = createTestUser({
        id: TEST_CONSTANTS.USER_ID,
        clerkId: TEST_CONSTANTS.CLERK_ID,
        email: 'test@example.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
      });

      vi.mocked(mockRepository.findByClerkId).mockResolvedValue(deletedUser);
      mockPrisma.user.findUnique.mockResolvedValue({
        deletedAt: new Date(), // User is soft deleted
      });

      // Act & Assert
      await expect(useCase.execute(TEST_CONSTANTS.CLERK_ID)).rejects.toThrow(
        'Your account has been deleted. Please contact support.'
      );

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: TEST_CONSTANTS.USER_ID },
        select: { deletedAt: true },
      });
    });

    it('should return user when user is active and not deleted', async () => {
      // Arrange
      const activeUser = createTestUser({
        id: TEST_CONSTANTS.USER_ID,
        clerkId: TEST_CONSTANTS.CLERK_ID,
        email: 'test@example.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
      });

      vi.mocked(mockRepository.findByClerkId).mockResolvedValue(activeUser);
      mockPrisma.user.findUnique.mockResolvedValue({
        deletedAt: null, // User is not deleted
      });

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.CLERK_ID);

      // Assert
      expect(result).toEqual(activeUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: TEST_CONSTANTS.USER_ID },
        select: { deletedAt: true },
      });
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

