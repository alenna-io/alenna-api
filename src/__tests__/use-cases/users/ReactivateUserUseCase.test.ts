import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReactivateUserUseCase } from '../../../core/app/use-cases/users/ReactivateUserUseCase';
import { createMockUserRepository } from '../../utils/mockRepositories';
import { User } from '../../../core/domain/entities';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      userRole: {
        findMany: vi.fn(),
      },
      student: {
        findUnique: vi.fn(),
      },
      userStudent: {
        map: vi.fn(),
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

describe('ReactivateUserUseCase', () => {
  let useCase: ReactivateUserUseCase;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    useCase = new ReactivateUserUseCase(mockUserRepository);
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
    mockUnlockUser.mockResolvedValue(undefined);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('execute', () => {
    it('should reactivate teacher successfully', async () => {
      const inactiveUser = User.create({
        id: 'user-1',
        email: 'teacher@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: false,
        clerkId: 'clerk-teacher-1',
      });

      const reactivatedUser = User.create({
        id: 'user-1',
        email: 'teacher@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
        clerkId: 'clerk-teacher-1',
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(inactiveUser);
      vi.mocked(mockUserRepository.reactivate).mockResolvedValue(reactivatedUser);
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { name: 'TEACHER' } },
      ]);

      await useCase.execute('user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN']);

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-1');
      expect(mockUserRepository.reactivate).toHaveBeenCalledWith('user-1');
      expect(mockUnlockUser).toHaveBeenCalledWith('clerk-teacher-1');
    });

    it('should throw error when user not found', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      await expect(
        useCase.execute('non-existent', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN'])
      ).rejects.toThrow('User not found');
    });

    it('should throw error when user is already active', async () => {
      const activeUser = User.create({
        id: 'user-1',
        email: 'teacher@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(activeUser);

      await expect(
        useCase.execute('user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN'])
      ).rejects.toThrow('User is already active');
    });

    it('should throw error when school admin tries to reactivate user from different school', async () => {
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

    it('should allow super admin to reactivate user from any school', async () => {
      const inactiveUser = User.create({
        id: 'user-1',
        email: 'teacher@test.com',
        schoolId: 'different-school',
        isActive: false,
        clerkId: 'clerk-teacher-1',
      });

      const reactivatedUser = User.create({
        id: 'user-1',
        email: 'teacher@test.com',
        schoolId: 'different-school',
        isActive: true,
        clerkId: 'clerk-teacher-1',
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(inactiveUser);
      vi.mocked(mockUserRepository.reactivate).mockResolvedValue(reactivatedUser);
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { name: 'TEACHER' } },
      ]);

      await useCase.execute('user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SUPERADMIN']);

      expect(mockUserRepository.reactivate).toHaveBeenCalled();
    });

    it('should throw error when school admin tries to reactivate parent directly', async () => {
      const inactiveUser = User.create({
        id: 'user-1',
        email: 'parent@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: false,
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(inactiveUser);
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { name: 'PARENT' } },
      ]);

      await expect(
        useCase.execute('user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN'])
      ).rejects.toThrow('Cannot reactivate parent directly. Reactivate the linked student instead.');
    });

    it('should throw error when school admin tries to reactivate non-teacher non-student', async () => {
      const inactiveUser = User.create({
        id: 'user-1',
        email: 'user@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: false,
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(inactiveUser);
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { name: 'SCHOOL_ADMIN' } },
      ]);

      await expect(
        useCase.execute('user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN'])
      ).rejects.toThrow('You can only reactivate teachers and students');
    });

    it('should reactivate student and linked parents', async () => {
      const inactiveStudent = User.create({
        id: 'student-user-1',
        email: 'student@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: false,
        clerkId: 'clerk-student-1',
      });

      const inactiveParent = User.create({
        id: 'parent-user-1',
        email: 'parent@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: false,
        clerkId: 'clerk-parent-1',
      });

      const reactivatedStudent = User.create({
        id: 'student-user-1',
        email: 'student@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
        clerkId: 'clerk-student-1',
      });

      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(inactiveStudent)
        .mockResolvedValueOnce(inactiveParent);
      vi.mocked(mockUserRepository.reactivate)
        .mockResolvedValueOnce(reactivatedStudent)
        .mockResolvedValueOnce(inactiveParent);
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { name: 'STUDENT' } },
      ]);
      mockPrisma.student.findUnique.mockResolvedValue({
        id: 'student-1',
        userId: 'student-user-1',
        userStudents: [
          {
            userId: 'parent-user-1',
            user: inactiveParent,
          },
        ],
      });

      await useCase.execute('student-user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN']);

      expect(mockUserRepository.reactivate).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.reactivate).toHaveBeenCalledWith('student-user-1');
      expect(mockUserRepository.reactivate).toHaveBeenCalledWith('parent-user-1');
    });

    it('should continue even if Clerk unlock fails', async () => {
      const inactiveUser = User.create({
        id: 'user-1',
        email: 'teacher@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: false,
        clerkId: 'clerk-teacher-1',
      });

      const reactivatedUser = User.create({
        id: 'user-1',
        email: 'teacher@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
        clerkId: 'clerk-teacher-1',
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(inactiveUser);
      vi.mocked(mockUserRepository.reactivate).mockResolvedValue(reactivatedUser);
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { name: 'TEACHER' } },
      ]);
      mockUnlockUser.mockRejectedValue(new Error('Clerk error'));

      await useCase.execute('user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN']);

      expect(mockUserRepository.reactivate).toHaveBeenCalled();
    });
  });
});

