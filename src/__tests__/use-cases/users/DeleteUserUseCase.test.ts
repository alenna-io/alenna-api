import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteUserUseCase } from '../../../core/app/use-cases/users/DeleteUserUseCase';
import { createMockUserRepository } from '../../utils/mockRepositories';
import { User } from '../../../core/domain/entities';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      userRole: {
        findMany: vi.fn(),
      },
      userStudent: {
        findMany: vi.fn(),
      },
      student: {
        findUnique: vi.fn(),
      },
      user: {
        update: vi.fn(),
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

const { mockDeleteUser } = vi.hoisted(() => {
  return {
    mockDeleteUser: vi.fn(),
  };
});

vi.mock('../../../core/frameworks/services/ClerkService', () => {
  return {
    clerkService: {
      deleteUser: mockDeleteUser,
    },
  };
});

describe('DeleteUserUseCase', () => {
  let useCase: DeleteUserUseCase;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    useCase = new DeleteUserUseCase(mockUserRepository);
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
    mockDeleteUser.mockResolvedValue(undefined);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('execute', () => {
    it('should delete inactive user successfully', async () => {
      const inactiveUser = User.create({
        id: 'user-1',
        email: 'teacher@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: false,
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(inactiveUser);
      vi.mocked(mockUserRepository.delete).mockResolvedValue(undefined);
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { name: 'TEACHER' } },
      ]);

      await useCase.execute('user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN']);

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-1');
      expect(mockUserRepository.delete).toHaveBeenCalledWith('user-1');
    });

    it('should throw error when trying to delete own account', async () => {
      const user = User.create({
        id: 'user-1',
        email: 'user@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: false,
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      await expect(
        useCase.execute('user-1', 'user-1', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN'])
      ).rejects.toThrow('Cannot delete your own account');
    });

    it('should throw error when user not found', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      await expect(
        useCase.execute('non-existent', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN'])
      ).rejects.toThrow('User not found');
    });

    it('should throw error when trying to delete active user', async () => {
      const activeUser = User.create({
        id: 'user-1',
        email: 'teacher@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(activeUser);

      await expect(
        useCase.execute('user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN'])
      ).rejects.toThrow('Cannot delete active user. Deactivate the user first.');
    });

    it('should throw error when school admin tries to delete user from different school', async () => {
      const inactiveUser = User.create({
        id: 'user-1',
        email: 'teacher@test.com',
        schoolId: 'different-school',
        isActive: false,
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(inactiveUser);

      await expect(
        useCase.execute('user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN'])
      ).rejects.toThrow('User does not belong to your school');
    });

    it('should allow super admin to delete user from any school', async () => {
      const inactiveUser = User.create({
        id: 'user-1',
        email: 'teacher@test.com',
        schoolId: 'different-school',
        isActive: false,
        clerkId: 'clerk-teacher-1',
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(inactiveUser);
      vi.mocked(mockUserRepository.delete).mockResolvedValue(undefined);
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { name: 'TEACHER' } },
      ]);

      await useCase.execute('user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SUPERADMIN']);

      expect(mockDeleteUser).toHaveBeenCalledWith('clerk-teacher-1');
      expect(mockUserRepository.delete).toHaveBeenCalled();
    });

    it('should delete user from Clerk when super admin deletes', async () => {
      const inactiveUser = User.create({
        id: 'user-1',
        email: 'teacher@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: false,
        clerkId: 'clerk-teacher-1',
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(inactiveUser);
      vi.mocked(mockUserRepository.delete).mockResolvedValue(undefined);
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { name: 'TEACHER' } },
      ]);
      mockPrisma.user.update.mockResolvedValue({});

      await useCase.execute('user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SUPERADMIN']);

      expect(mockDeleteUser).toHaveBeenCalledWith('clerk-teacher-1');
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('should throw error when deleting parent with active students', async () => {
      const inactiveParent = User.create({
        id: 'parent-user-1',
        email: 'parent@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: false,
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(inactiveParent);
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { name: 'PARENT' } },
      ]);
      mockPrisma.userStudent.findMany.mockResolvedValue([
        {
          userId: 'parent-user-1',
          student: {
            id: 'student-1',
            user: {
              id: 'student-user-1',
              isActive: true,
              deletedAt: null,
            },
          },
        },
      ]);

      await expect(
        useCase.execute('parent-user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN'])
      ).rejects.toThrow('Cannot delete parent with active students. Deactivate the students first.');
    });

    it('should delete student and parent when parent has no other students', async () => {
      const inactiveStudent = User.create({
        id: 'student-user-1',
        email: 'student@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: false,
      });

      const parentUser = User.create({
        id: 'parent-user-1',
        email: 'parent@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: false,
      });

      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(inactiveStudent)
        .mockResolvedValueOnce(parentUser);
      vi.mocked(mockUserRepository.delete).mockResolvedValue(undefined);
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { name: 'STUDENT' } },
      ]);
      mockPrisma.student.findUnique.mockResolvedValue({
        id: 'student-1',
        userId: 'student-user-1',
        userStudents: [
          {
            userId: 'parent-user-1',
            user: parentUser,
          },
        ],
      });
      mockPrisma.userStudent.findMany.mockResolvedValue([]);

      await useCase.execute('student-user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN']);

      expect(mockUserRepository.delete).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.delete).toHaveBeenCalledWith('student-user-1');
      expect(mockUserRepository.delete).toHaveBeenCalledWith('parent-user-1');
    });
  });
});

