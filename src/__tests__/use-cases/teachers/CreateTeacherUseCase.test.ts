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

describe('CreateTeacherUseCase (via CreateUserUseCase with TEACHER role)', () => {
  let useCase: CreateUserUseCase;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    useCase = new CreateUserUseCase(mockUserRepository);
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
    mockCreateUser.mockResolvedValue('clerk-teacher-123');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('execute - creating teacher', () => {
    it('should create teacher successfully with TEACHER role', async () => {
      const teacherRole = { id: 'teacher-role-id', name: 'TEACHER', schoolId: null };
      const school = { id: TEST_CONSTANTS.SCHOOL_ID, teacherLimit: null };

      const newTeacher = User.create({
        id: 'user-1',
        email: 'teacher@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        firstName: 'John',
        lastName: 'Doe',
        clerkId: 'clerk-teacher-123',
      });

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepository.findByEmailIncludingDeleted).mockResolvedValue(null);
      mockPrisma.role.findFirst.mockResolvedValue(teacherRole);
      mockPrisma.school.findUnique.mockResolvedValue(school);
      vi.mocked(mockUserRepository.create).mockResolvedValue(newTeacher);

      const result = await useCase.execute({
        email: 'teacher@test.com',
        firstName: 'John',
        lastName: 'Doe',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        roleIds: ['teacher-role-id'],
      });

      expect(result).toEqual(newTeacher);
      expect(mockPrisma.role.findFirst).toHaveBeenCalledWith({
        where: { name: 'TEACHER', schoolId: null },
      });
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should enforce teacher limit when school has limit set', async () => {
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
      const newTeacher = User.create({
        id: 'user-1',
        email: 'teacher@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        clerkId: 'clerk-teacher-123',
      });

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepository.findByEmailIncludingDeleted).mockResolvedValue(null);
      mockPrisma.role.findFirst.mockResolvedValue(teacherRole);
      mockPrisma.school.findUnique.mockResolvedValue(school);
      mockPrisma.user.count.mockResolvedValue(4);
      vi.mocked(mockUserRepository.create).mockResolvedValue(newTeacher);

      const result = await useCase.execute({
        email: 'teacher@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        roleIds: ['teacher-role-id'],
      });

      expect(result).toEqual(newTeacher);
      expect(mockPrisma.user.count).toHaveBeenCalled();
    });

    it('should allow creating teacher when school has no limit', async () => {
      const teacherRole = { id: 'teacher-role-id', name: 'TEACHER', schoolId: null };
      const school = { id: TEST_CONSTANTS.SCHOOL_ID, teacherLimit: null };
      const newTeacher = User.create({
        id: 'user-1',
        email: 'teacher@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        clerkId: 'clerk-teacher-123',
      });

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepository.findByEmailIncludingDeleted).mockResolvedValue(null);
      mockPrisma.role.findFirst.mockResolvedValue(teacherRole);
      mockPrisma.school.findUnique.mockResolvedValue(school);
      vi.mocked(mockUserRepository.create).mockResolvedValue(newTeacher);

      const result = await useCase.execute({
        email: 'teacher@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        roleIds: ['teacher-role-id'],
      });

      expect(result).toEqual(newTeacher);
      expect(mockPrisma.user.count).not.toHaveBeenCalled();
    });

    it('should count only non-deleted teachers for limit check', async () => {
      const teacherRole = { id: 'teacher-role-id', name: 'TEACHER', schoolId: null };
      const school = { id: TEST_CONSTANTS.SCHOOL_ID, teacherLimit: 5 };

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepository.findByEmailIncludingDeleted).mockResolvedValue(null);
      mockPrisma.role.findFirst.mockResolvedValue(teacherRole);
      mockPrisma.school.findUnique.mockResolvedValue(school);
      mockPrisma.user.count.mockResolvedValue(4);

      const newTeacher = User.create({
        id: 'user-1',
        email: 'teacher@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        clerkId: 'clerk-teacher-123',
      });

      vi.mocked(mockUserRepository.create).mockResolvedValue(newTeacher);

      await useCase.execute({
        email: 'teacher@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        roleIds: ['teacher-role-id'],
      });

      expect(mockPrisma.user.count).toHaveBeenCalledWith({
        where: {
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          deletedAt: null,
          userRoles: {
            some: {
              roleId: 'teacher-role-id',
            },
          },
        },
      });
    });

    it('should not check teacher limit when creating non-teacher user', async () => {
      const adminRole = { id: 'admin-role-id', name: 'SCHOOL_ADMIN', schoolId: null };
      const newUser = User.create({
        id: 'user-1',
        email: 'admin@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        clerkId: 'clerk-admin-123',
      });

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepository.findByEmailIncludingDeleted).mockResolvedValue(null);
      mockPrisma.role.findFirst.mockResolvedValue(null);
      vi.mocked(mockUserRepository.create).mockResolvedValue(newUser);

      await useCase.execute({
        email: 'admin@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        roleIds: ['admin-role-id'],
      });

      expect(mockPrisma.school.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.user.count).not.toHaveBeenCalled();
    });

    it('should validate email uniqueness for teachers', async () => {
      const existingTeacher = User.create({
        id: 'user-1',
        email: 'teacher@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(existingTeacher);

      await expect(
        useCase.execute({
          email: 'teacher@test.com',
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          roleIds: ['teacher-role-id'],
        })
      ).rejects.toThrow('User with this email already exists');
    });
  });
});

