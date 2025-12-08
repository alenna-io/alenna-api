import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateUserUseCase } from '../../../core/app/use-cases/users/CreateUserUseCase';
import { createMockUserRepository } from '../../utils/mockRepositories';
import { User } from '../../../core/domain/entities';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      role: {
        findFirst: vi.fn(),
      },
      school: {
        findUnique: vi.fn(),
      },
      user: {
        count: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      userRole: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
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

const { mockCreateUser } = vi.hoisted(() => {
  return {
    mockCreateUser: vi.fn(),
  };
});

vi.mock('../../../core/frameworks/services/ClerkService', () => {
  return {
    clerkService: {
      createUser: mockCreateUser,
    },
  };
});

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    useCase = new CreateUserUseCase(mockUserRepository);
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
    mockCreateUser.mockResolvedValue('clerk-user-123');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('execute', () => {
    it('should create user successfully', async () => {
      const newUser = User.create({
        id: 'user-1',
        email: 'teacher@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        firstName: 'John',
        lastName: 'Doe',
        clerkId: 'clerk-user-123',
      });

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepository.findByEmailIncludingDeleted).mockResolvedValue(null);
      vi.mocked(mockUserRepository.create).mockResolvedValue(newUser);
      mockPrisma.role.findFirst.mockResolvedValue(null);

      const result = await useCase.execute({
        email: 'teacher@test.com',
        firstName: 'John',
        lastName: 'Doe',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        roleIds: ['role-1'],
      });

      expect(result).toEqual(newUser);
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: 'teacher@test.com',
        firstName: 'John',
        lastName: 'Doe',
        password: undefined,
      });
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should create user with provided clerkId', async () => {
      const newUser = User.create({
        id: 'user-1',
        email: 'teacher@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        clerkId: 'provided-clerk-id',
      });

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepository.findByEmailIncludingDeleted).mockResolvedValue(null);
      vi.mocked(mockUserRepository.findByClerkId).mockResolvedValue(null);
      vi.mocked(mockUserRepository.create).mockResolvedValue(newUser);
      mockPrisma.role.findFirst.mockResolvedValue(null);

      const result = await useCase.execute({
        email: 'teacher@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        clerkId: 'provided-clerk-id',
        roleIds: ['role-1'],
      });

      expect(result).toEqual(newUser);
      expect(mockCreateUser).not.toHaveBeenCalled();
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should throw error when email already exists', async () => {
      const existingUser = User.create({
        id: 'user-1',
        email: 'teacher@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(existingUser);

      await expect(
        useCase.execute({
          email: 'teacher@test.com',
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          roleIds: ['role-1'],
        })
      ).rejects.toThrow('User with this email already exists');
    });

    it('should throw error when clerkId already exists', async () => {
      const existingUser = User.create({
        id: 'user-1',
        email: 'other@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        clerkId: 'existing-clerk-id',
      });

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepository.findByEmailIncludingDeleted).mockResolvedValue(null);
      vi.mocked(mockUserRepository.findByClerkId).mockResolvedValue(existingUser);

      await expect(
        useCase.execute({
          email: 'teacher@test.com',
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          clerkId: 'existing-clerk-id',
          roleIds: ['role-1'],
        })
      ).rejects.toThrow('User with this Clerk ID already exists');
    });

    it('should reactivate soft-deleted user with same email', async () => {
      const deletedUser = User.create({
        id: 'user-1',
        email: 'teacher@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: false,
      });

      const reactivatedUser = User.create({
        id: 'user-1',
        email: 'teacher@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
        clerkId: 'clerk-user-123',
        firstName: 'John',
        lastName: 'Doe',
      });

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepository.findByEmailIncludingDeleted).mockResolvedValue(deletedUser);
      mockPrisma.user.findUnique.mockResolvedValue({ deletedAt: new Date() });
      vi.mocked(mockUserRepository.reactivate).mockResolvedValue(reactivatedUser);
      vi.mocked(mockUserRepository.update).mockResolvedValue(reactivatedUser);
      mockPrisma.userRole.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.userRole.createMany.mockResolvedValue({ count: 1 });
      vi.mocked(mockUserRepository.findById).mockResolvedValue(reactivatedUser);

      const result = await useCase.execute({
        email: 'teacher@test.com',
        firstName: 'John',
        lastName: 'Doe',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        roleIds: ['role-1'],
      });

      expect(result).toEqual(reactivatedUser);
      expect(mockUserRepository.reactivate).toHaveBeenCalledWith('user-1');
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should check teacher limit when creating teacher', async () => {
      const teacherRole = { id: 'teacher-role-id', name: 'TEACHER', schoolId: null };
      const school = { id: TEST_CONSTANTS.SCHOOL_ID, teacherLimit: 5 };

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepository.findByEmailIncludingDeleted).mockResolvedValue(null);
      mockPrisma.role.findFirst.mockResolvedValue(teacherRole);
      mockPrisma.school.findUnique.mockResolvedValue(school);
      mockPrisma.user.count.mockResolvedValue(5);

      await expect(
        useCase.execute({
          email: 'teacher@test.com',
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          roleIds: ['teacher-role-id'],
        })
      ).rejects.toThrow('Se ha alcanzado el límite de maestros permitidos');
    });

    it('should allow creating teacher when under limit', async () => {
      const teacherRole = { id: 'teacher-role-id', name: 'TEACHER', schoolId: null };
      const school = { id: TEST_CONSTANTS.SCHOOL_ID, teacherLimit: 5 };
      const newUser = User.create({
        id: 'user-1',
        email: 'teacher@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        clerkId: 'clerk-user-123',
      });

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepository.findByEmailIncludingDeleted).mockResolvedValue(null);
      mockPrisma.role.findFirst.mockResolvedValue(teacherRole);
      mockPrisma.school.findUnique.mockResolvedValue(school);
      mockPrisma.user.count.mockResolvedValue(4);
      vi.mocked(mockUserRepository.create).mockResolvedValue(newUser);

      const result = await useCase.execute({
        email: 'teacher@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        roleIds: ['teacher-role-id'],
      });

      expect(result).toEqual(newUser);
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should not check teacher limit when creating non-teacher', async () => {
      const newUser = User.create({
        id: 'user-1',
        email: 'admin@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        clerkId: 'clerk-user-123',
      });

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepository.findByEmailIncludingDeleted).mockResolvedValue(null);
      mockPrisma.role.findFirst.mockResolvedValue(null);
      vi.mocked(mockUserRepository.create).mockResolvedValue(newUser);

      const result = await useCase.execute({
        email: 'admin@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        roleIds: ['admin-role-id'],
      });

      expect(result).toEqual(newUser);
      expect(mockPrisma.school.findUnique).not.toHaveBeenCalled();
    });

    it('should throw error when Clerk user creation fails', async () => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepository.findByEmailIncludingDeleted).mockResolvedValue(null);
      mockPrisma.role.findFirst.mockResolvedValue(null);
      mockCreateUser.mockRejectedValue(new Error('Clerk API error'));

      await expect(
        useCase.execute({
          email: 'teacher@test.com',
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          roleIds: ['role-1'],
        })
      ).rejects.toThrow('Failed to create Clerk user');
    });
  });
});

