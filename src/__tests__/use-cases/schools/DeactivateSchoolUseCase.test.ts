import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeactivateSchoolUseCase } from '../../../core/app/use-cases/schools/DeactivateSchoolUseCase';
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
const { mockLockUser } = vi.hoisted(() => {
  return {
    mockLockUser: vi.fn(),
  };
});

vi.mock('../../../core/frameworks/services/ClerkService', () => {
  return {
    clerkService: {
      lockUser: mockLockUser,
    },
  };
});

describe('DeactivateSchoolUseCase', () => {
  let useCase: DeactivateSchoolUseCase;
  let mockSchoolRepository: ReturnType<typeof createMockSchoolRepository>;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    mockSchoolRepository = createMockSchoolRepository();
    mockUserRepository = createMockUserRepository();
    useCase = new DeactivateSchoolUseCase(mockSchoolRepository, mockUserRepository);
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
    mockLockUser.mockResolvedValue(undefined);
  });

  describe('execute', () => {
    it('should deactivate school and deactivate users', async () => {
      // Arrange
      const school = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: true,
      });

      const users = [
        {
          id: 'user-1',
          clerkId: 'clerk-1',
          schoolId: 'school-1',
          isActive: true,
          deletedAt: null,
          userRoles: [],
        },
        {
          id: 'user-2',
          clerkId: 'clerk-2',
          schoolId: 'school-1',
          isActive: true,
          deletedAt: null,
          userRoles: [],
        },
      ];

      const deactivatedSchool = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: false,
      });

      vi.mocked(mockSchoolRepository.findById).mockResolvedValue(school);
      vi.mocked(mockSchoolRepository.deactivate).mockResolvedValue(deactivatedSchool);
      mockPrisma.user.findMany.mockResolvedValue(users);
      const deactivatedUser = User.create({ id: 'user-1', email: 'user1@test.com', schoolId: 'school-1', isActive: false });
      vi.mocked(mockUserRepository.deactivate).mockResolvedValue(deactivatedUser);

      // Act
      await useCase.execute('school-1');

      // Assert
      expect(mockSchoolRepository.findById).toHaveBeenCalledWith('school-1');
      expect(mockSchoolRepository.deactivate).toHaveBeenCalledWith('school-1');
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          schoolId: 'school-1',
          isActive: true,
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
      expect(mockUserRepository.deactivate).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.deactivate).toHaveBeenCalledWith('user-1');
      expect(mockUserRepository.deactivate).toHaveBeenCalledWith('user-2');
      expect(mockLockUser).toHaveBeenCalledTimes(2);
      expect(mockLockUser).toHaveBeenCalledWith('clerk-1');
      expect(mockLockUser).toHaveBeenCalledWith('clerk-2');
    });

    it('should throw error when school not found', async () => {
      // Arrange
      vi.mocked(mockSchoolRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute('non-existent-id')).rejects.toThrow('School not found');
      expect(mockSchoolRepository.deactivate).not.toHaveBeenCalled();
    });

    it('should throw error when school is already inactive', async () => {
      // Arrange
      const school = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: false,
      });

      vi.mocked(mockSchoolRepository.findById).mockResolvedValue(school);

      // Act & Assert
      await expect(useCase.execute('school-1')).rejects.toThrow('School is already inactive');
      expect(mockSchoolRepository.deactivate).not.toHaveBeenCalled();
    });

    it('should handle users without clerkId', async () => {
      // Arrange
      const school = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: true,
      });

      const users = [
        {
          id: 'user-1',
          clerkId: null,
          schoolId: 'school-1',
          isActive: true,
          deletedAt: null,
          userRoles: [],
        },
      ];

      const deactivatedSchool = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: false,
      });

      vi.mocked(mockSchoolRepository.findById).mockResolvedValue(school);
      vi.mocked(mockSchoolRepository.deactivate).mockResolvedValue(deactivatedSchool);
      mockPrisma.user.findMany.mockResolvedValue(users);
      const deactivatedUser = User.create({ id: 'user-1', email: 'user1@test.com', schoolId: 'school-1', isActive: false });
      vi.mocked(mockUserRepository.deactivate).mockResolvedValue(deactivatedUser);

      // Act
      await useCase.execute('school-1');

      // Assert
      expect(mockUserRepository.deactivate).toHaveBeenCalledWith('user-1');
      expect(mockLockUser).not.toHaveBeenCalled();
    });

    it('should continue even if Clerk lock fails', async () => {
      // Arrange
      const school = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: true,
      });

      const users = [
        {
          id: 'user-1',
          clerkId: 'clerk-1',
          schoolId: 'school-1',
          isActive: true,
          deletedAt: null,
          userRoles: [],
        },
      ];

      const deactivatedSchool = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: false,
      });

      vi.mocked(mockSchoolRepository.findById).mockResolvedValue(school);
      vi.mocked(mockSchoolRepository.deactivate).mockResolvedValue(deactivatedSchool);
      mockPrisma.user.findMany.mockResolvedValue(users);
      const deactivatedUser = User.create({ id: 'user-1', email: 'user1@test.com', schoolId: 'school-1', isActive: false });
      vi.mocked(mockUserRepository.deactivate).mockResolvedValue(deactivatedUser);
      mockLockUser.mockRejectedValue(new Error('Clerk lock failed'));

      // Act
      await useCase.execute('school-1');

      // Assert
      expect(mockUserRepository.deactivate).toHaveBeenCalledWith('user-1');
      expect(mockLockUser).toHaveBeenCalledWith('clerk-1');
    });

    it('should handle no active users', async () => {
      // Arrange
      const school = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: true,
      });

      const deactivatedSchool = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: false,
      });

      vi.mocked(mockSchoolRepository.findById).mockResolvedValue(school);
      vi.mocked(mockSchoolRepository.deactivate).mockResolvedValue(deactivatedSchool);
      mockPrisma.user.findMany.mockResolvedValue([]);

      // Act
      await useCase.execute('school-1');

      // Assert
      expect(mockSchoolRepository.deactivate).toHaveBeenCalledWith('school-1');
      expect(mockUserRepository.deactivate).not.toHaveBeenCalled();
      expect(mockLockUser).not.toHaveBeenCalled();
    });
  });
});

