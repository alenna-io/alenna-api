import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivateSchoolUseCase } from '../../../core/app/use-cases/schools/ActivateSchoolUseCase';
import { createMockSchoolRepository, createMockUserRepository } from '../../utils/mockRepositories';
import { School, User } from '../../../core/domain/entities';

// Mock Prisma Client
const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      user: {
        findMany: vi.fn(),
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

// Mock ClerkService
const { mockUnlockUser } = vi.hoisted(() => {
  return {
    mockUnlockUser: vi.fn(),
  };
});

vi.mock('../../../core/frameworks/services/ClerkService', () => {
  return {
    clerkService: {
      unlockUser: mockUnlockUser,
    },
  };
});

describe('ActivateSchoolUseCase', () => {
  let useCase: ActivateSchoolUseCase;
  let mockSchoolRepository: ReturnType<typeof createMockSchoolRepository>;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    mockSchoolRepository = createMockSchoolRepository();
    mockUserRepository = createMockUserRepository();
    useCase = new ActivateSchoolUseCase(mockSchoolRepository, mockUserRepository);
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
    mockUnlockUser.mockResolvedValue(undefined);
  });

  describe('execute', () => {
    it('should activate school and reactivate users', async () => {
      // Arrange
      const school = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: false,
      });

      const users = [
        {
          id: 'user-1',
          clerkId: 'clerk-1',
          schoolId: 'school-1',
          isActive: false,
          deletedAt: null,
          userRoles: [],
        },
        {
          id: 'user-2',
          clerkId: 'clerk-2',
          schoolId: 'school-1',
          isActive: false,
          deletedAt: null,
          userRoles: [],
        },
      ];

      const activatedSchool = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: true,
      });

      vi.mocked(mockSchoolRepository.findById).mockResolvedValue(school);
      vi.mocked(mockSchoolRepository.activate).mockResolvedValue(activatedSchool);
      mockPrisma.user.findMany.mockResolvedValue(users);
      const reactivatedUser = User.create({ id: 'user-1', email: 'user1@test.com', schoolId: 'school-1', isActive: true });
      vi.mocked(mockUserRepository.reactivate).mockResolvedValue(reactivatedUser);

      // Act
      await useCase.execute('school-1');

      // Assert
      expect(mockSchoolRepository.findById).toHaveBeenCalledWith('school-1');
      expect(mockSchoolRepository.activate).toHaveBeenCalledWith('school-1');
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          schoolId: 'school-1',
          isActive: false,
          deletedAt: null,
        },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
      expect(mockUserRepository.reactivate).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.reactivate).toHaveBeenCalledWith('user-1');
      expect(mockUserRepository.reactivate).toHaveBeenCalledWith('user-2');
      expect(mockUnlockUser).toHaveBeenCalledTimes(2);
      expect(mockUnlockUser).toHaveBeenCalledWith('clerk-1');
      expect(mockUnlockUser).toHaveBeenCalledWith('clerk-2');
    });

    it('should throw error when school not found', async () => {
      // Arrange
      vi.mocked(mockSchoolRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute('non-existent-id')).rejects.toThrow('School not found');
      expect(mockSchoolRepository.activate).not.toHaveBeenCalled();
    });

    it('should throw error when school is already active', async () => {
      // Arrange
      const school = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: true,
      });

      vi.mocked(mockSchoolRepository.findById).mockResolvedValue(school);

      // Act & Assert
      await expect(useCase.execute('school-1')).rejects.toThrow('School is already active');
      expect(mockSchoolRepository.activate).not.toHaveBeenCalled();
    });

    it('should handle users without clerkId', async () => {
      // Arrange
      const school = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: false,
      });

      const users = [
        {
          id: 'user-1',
          clerkId: null,
          schoolId: 'school-1',
          isActive: false,
          deletedAt: null,
          userRoles: [],
        },
      ];

      const activatedSchool = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: true,
      });

      vi.mocked(mockSchoolRepository.findById).mockResolvedValue(school);
      vi.mocked(mockSchoolRepository.activate).mockResolvedValue(activatedSchool);
      mockPrisma.user.findMany.mockResolvedValue(users);
      const reactivatedUser = User.create({ id: 'user-1', email: 'user1@test.com', schoolId: 'school-1', isActive: true });
      vi.mocked(mockUserRepository.reactivate).mockResolvedValue(reactivatedUser);

      // Act
      await useCase.execute('school-1');

      // Assert
      expect(mockUserRepository.reactivate).toHaveBeenCalledWith('user-1');
      expect(mockUnlockUser).not.toHaveBeenCalled();
    });

    it('should continue even if Clerk unlock fails', async () => {
      // Arrange
      const school = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: false,
      });

      const users = [
        {
          id: 'user-1',
          clerkId: 'clerk-1',
          schoolId: 'school-1',
          isActive: false,
          deletedAt: null,
          userRoles: [],
        },
      ];

      const activatedSchool = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: true,
      });

      vi.mocked(mockSchoolRepository.findById).mockResolvedValue(school);
      vi.mocked(mockSchoolRepository.activate).mockResolvedValue(activatedSchool);
      mockPrisma.user.findMany.mockResolvedValue(users);
      const reactivatedUser = User.create({ id: 'user-1', email: 'user1@test.com', schoolId: 'school-1', isActive: true });
      vi.mocked(mockUserRepository.reactivate).mockResolvedValue(reactivatedUser);
      mockUnlockUser.mockRejectedValue(new Error('Clerk unlock failed'));

      // Act
      await useCase.execute('school-1');

      // Assert
      expect(mockUserRepository.reactivate).toHaveBeenCalledWith('user-1');
      expect(mockUnlockUser).toHaveBeenCalledWith('clerk-1');
    });

    it('should handle no inactive users', async () => {
      // Arrange
      const school = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: false,
      });

      const activatedSchool = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: true,
      });

      vi.mocked(mockSchoolRepository.findById).mockResolvedValue(school);
      vi.mocked(mockSchoolRepository.activate).mockResolvedValue(activatedSchool);
      mockPrisma.user.findMany.mockResolvedValue([]);

      // Act
      await useCase.execute('school-1');

      // Assert
      expect(mockSchoolRepository.activate).toHaveBeenCalledWith('school-1');
      expect(mockUserRepository.reactivate).not.toHaveBeenCalled();
      expect(mockUnlockUser).not.toHaveBeenCalled();
    });
  });
});

