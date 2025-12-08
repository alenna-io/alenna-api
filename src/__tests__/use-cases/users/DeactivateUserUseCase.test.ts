import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeactivateUserUseCase } from '../../../core/app/use-cases/users/DeactivateUserUseCase';
import { createMockUserRepository } from '../../utils/mockRepositories';
import { User } from '../../../core/domain/entities';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

// Mock Prisma Client
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
        findMany: vi.fn(),
      },
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

describe('DeactivateUserUseCase', () => {
  let useCase: DeactivateUserUseCase;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    useCase = new DeactivateUserUseCase(mockUserRepository);
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
    mockLockUser.mockResolvedValue(undefined);
    // Suppress console.error for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('execute', () => {
    it('should deactivate student successfully', async () => {
      // Arrange
      const studentUser = User.create({
        id: 'user-1',
        email: 'student@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
        clerkId: 'clerk-student-1',
      });

      const deactivatedUser = User.create({
        id: 'user-1',
        email: 'student@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: false,
        clerkId: 'clerk-student-1',
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(studentUser);
      vi.mocked(mockUserRepository.deactivate).mockResolvedValue(deactivatedUser);
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { name: 'STUDENT' } },
      ]);
      mockPrisma.student.findUnique.mockResolvedValue({
        id: 'student-1',
        userId: 'user-1',
        userStudents: [],
      });

      // Act
      await useCase.execute('user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN']);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-1');
      expect(mockUserRepository.deactivate).toHaveBeenCalledWith('user-1');
      expect(mockLockUser).toHaveBeenCalledWith('clerk-student-1');
    });

    it('should deactivate student and parent when parent has no other active students', async () => {
      // Arrange
      const studentUser = User.create({
        id: 'user-1',
        email: 'student@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
        clerkId: 'clerk-student-1',
      });

      const parentUser = User.create({
        id: 'parent-user-1',
        email: 'parent@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
        clerkId: 'clerk-parent-1',
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(studentUser);
      vi.mocked(mockUserRepository.deactivate).mockResolvedValue(studentUser);
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { name: 'STUDENT' } },
      ]);
      mockPrisma.student.findUnique.mockResolvedValue({
        id: 'student-1',
        userId: 'user-1',
        userStudents: [
          {
            userId: 'parent-user-1',
            user: parentUser,
          },
        ],
      });
      // Query returns the student being deactivated (still active at query time)
      // After filtering it out, parent has no other active students
      mockPrisma.userStudent.findMany.mockResolvedValue([
        {
          userId: 'parent-user-1',
          student: {
            id: 'student-1', // This is the student being deactivated - will be filtered out
            user: { id: 'user-1', isActive: true },
          },
        },
      ]);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'parent-user-1',
        clerkId: 'clerk-parent-1',
      });
      vi.mocked(mockUserRepository.deactivate).mockResolvedValueOnce(studentUser).mockResolvedValueOnce(parentUser);

      // Act
      await useCase.execute('user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN']);

      // Assert
      expect(mockUserRepository.deactivate).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.deactivate).toHaveBeenCalledWith('user-1');
      expect(mockUserRepository.deactivate).toHaveBeenCalledWith('parent-user-1');
      expect(mockLockUser).toHaveBeenCalledWith('clerk-student-1');
      expect(mockLockUser).toHaveBeenCalledWith('clerk-parent-1');
    });

    it('should deactivate student but not parent when parent has other active students', async () => {
      // Arrange
      const studentUser = User.create({
        id: 'user-1',
        email: 'student@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
        clerkId: 'clerk-student-1',
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(studentUser);
      vi.mocked(mockUserRepository.deactivate).mockResolvedValue(studentUser);
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { name: 'STUDENT' } },
      ]);
      mockPrisma.student.findUnique.mockResolvedValue({
        id: 'student-1',
        userId: 'user-1',
        userStudents: [
          {
            userId: 'parent-user-1',
            user: { id: 'parent-user-1' },
          },
        ],
      });
      // Query returns both the student being deactivated AND another active student
      // After filtering out the student being deactivated, parent still has other active students
      mockPrisma.userStudent.findMany.mockResolvedValue([
        {
          userId: 'parent-user-1',
          student: {
            id: 'student-1', // This is the student being deactivated - will be filtered out
            user: { id: 'user-1', isActive: true },
          },
        },
        {
          userId: 'parent-user-1',
          student: {
            id: 'student-2', // This is another active student - parent should NOT be deactivated
            user: { id: 'user-2', isActive: true },
          },
        },
      ]);

      // Act
      await useCase.execute('user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN']);

      // Assert
      expect(mockUserRepository.deactivate).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.deactivate).toHaveBeenCalledWith('user-1');
      expect(mockLockUser).toHaveBeenCalledWith('clerk-student-1');
    });

    it('should throw error when trying to deactivate yourself', async () => {
      // Arrange
      const user = User.create({
        id: 'user-1',
        email: 'user@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      // Act & Assert
      await expect(
        useCase.execute('user-1', 'user-1', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN'])
      ).rejects.toThrow('Cannot deactivate your own account');
      expect(mockUserRepository.deactivate).not.toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      // Arrange
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute('non-existent-id', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN'])
      ).rejects.toThrow('User not found');
      expect(mockUserRepository.deactivate).not.toHaveBeenCalled();
    });

    it('should throw error when user is already inactive', async () => {
      // Arrange
      const user = User.create({
        id: 'user-1',
        email: 'user@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: false,
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      // Act & Assert
      await expect(
        useCase.execute('user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN'])
      ).rejects.toThrow('User is already inactive');
      expect(mockUserRepository.deactivate).not.toHaveBeenCalled();
    });

    it('should throw error when school admin tries to deactivate user from different school', async () => {
      // Arrange
      const user = User.create({
        id: 'user-1',
        email: 'user@test.com',
        schoolId: 'different-school-id',
        isActive: true,
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      // Act & Assert
      await expect(
        useCase.execute('user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN'])
      ).rejects.toThrow('User does not belong to your school');
      expect(mockUserRepository.deactivate).not.toHaveBeenCalled();
    });

    it('should allow super admin to deactivate user from any school', async () => {
      // Arrange
      const user = User.create({
        id: 'user-1',
        email: 'user@test.com',
        schoolId: 'different-school-id',
        isActive: true,
        clerkId: 'clerk-1',
      });

      const deactivatedUser = User.create({
        id: 'user-1',
        email: 'user@test.com',
        schoolId: 'different-school-id',
        isActive: false,
        clerkId: 'clerk-1',
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockUserRepository.deactivate).mockResolvedValue(deactivatedUser);
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { name: 'TEACHER' } },
      ]);
      mockPrisma.student.findUnique.mockResolvedValue(null);

      // Act
      await useCase.execute('user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SUPERADMIN']);

      // Assert
      expect(mockUserRepository.deactivate).toHaveBeenCalledWith('user-1');
    });

    it('should throw error when school admin tries to deactivate parent directly', async () => {
      // Arrange
      const parentUser = User.create({
        id: 'parent-user-1',
        email: 'parent@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(parentUser);
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { name: 'PARENT' } },
      ]);

      // Act & Assert
      await expect(
        useCase.execute('parent-user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN'])
      ).rejects.toThrow('Cannot deactivate parent directly. Deactivate the linked student instead.');
      expect(mockUserRepository.deactivate).not.toHaveBeenCalled();
    });

    it('should allow super admin to deactivate parent directly', async () => {
      // Arrange
      const parentUser = User.create({
        id: 'parent-user-1',
        email: 'parent@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
        clerkId: 'clerk-parent-1',
      });

      const deactivatedUser = User.create({
        id: 'parent-user-1',
        email: 'parent@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: false,
        clerkId: 'clerk-parent-1',
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(parentUser);
      vi.mocked(mockUserRepository.deactivate).mockResolvedValue(deactivatedUser);
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { name: 'PARENT' } },
      ]);
      mockPrisma.student.findUnique.mockResolvedValue(null);

      // Act
      await useCase.execute('parent-user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SUPERADMIN']);

      // Assert
      expect(mockUserRepository.deactivate).toHaveBeenCalledWith('parent-user-1');
    });

    it('should throw error when school admin tries to deactivate non-teacher non-student', async () => {
      // Arrange
      const user = User.create({
        id: 'user-1',
        email: 'user@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { name: 'SCHOOL_ADMIN' } },
      ]);

      // Act & Assert
      await expect(
        useCase.execute('user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN'])
      ).rejects.toThrow('You can only deactivate teachers and students');
      expect(mockUserRepository.deactivate).not.toHaveBeenCalled();
    });

    it('should continue even if Clerk lock fails', async () => {
      // Arrange
      const studentUser = User.create({
        id: 'user-1',
        email: 'student@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
        clerkId: 'clerk-student-1',
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(studentUser);
      vi.mocked(mockUserRepository.deactivate).mockResolvedValue(studentUser);
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { name: 'STUDENT' } },
      ]);
      mockPrisma.student.findUnique.mockResolvedValue({
        id: 'student-1',
        userId: 'user-1',
        userStudents: [],
      });
      mockLockUser.mockRejectedValue(new Error('Clerk lock failed'));

      // Act
      await useCase.execute('user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN']);

      // Assert
      expect(mockUserRepository.deactivate).toHaveBeenCalledWith('user-1');
      expect(mockLockUser).toHaveBeenCalledWith('clerk-student-1');
    });

    it('should handle student without clerkId', async () => {
      // Arrange
      const studentUser = User.create({
        id: 'user-1',
        email: 'student@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
        clerkId: undefined,
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(studentUser);
      vi.mocked(mockUserRepository.deactivate).mockResolvedValue(studentUser);
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { name: 'STUDENT' } },
      ]);
      mockPrisma.student.findUnique.mockResolvedValue({
        id: 'student-1',
        userId: 'user-1',
        userStudents: [],
      });

      // Act
      await useCase.execute('user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN']);

      // Assert
      expect(mockUserRepository.deactivate).toHaveBeenCalledWith('user-1');
      expect(mockLockUser).not.toHaveBeenCalled();
    });

    it('should handle parent without clerkId when deactivating', async () => {
      // Arrange
      const studentUser = User.create({
        id: 'user-1',
        email: 'student@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
        clerkId: 'clerk-student-1',
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(studentUser);
      vi.mocked(mockUserRepository.deactivate).mockResolvedValue(studentUser);
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { name: 'STUDENT' } },
      ]);
      mockPrisma.student.findUnique.mockResolvedValue({
        id: 'student-1',
        userId: 'user-1',
        userStudents: [
          {
            userId: 'parent-user-1',
            user: { id: 'parent-user-1' },
          },
        ],
      });
      // Query returns the student being deactivated (still active at query time)
      // After filtering it out, parent has no other active students
      mockPrisma.userStudent.findMany.mockResolvedValue([
        {
          userId: 'parent-user-1',
          student: {
            id: 'student-1', // This is the student being deactivated - will be filtered out
            user: { id: 'user-1', isActive: true },
          },
        },
      ]);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'parent-user-1',
        clerkId: null,
      });
      vi.mocked(mockUserRepository.deactivate).mockResolvedValueOnce(studentUser).mockResolvedValueOnce({
        id: 'parent-user-1',
        email: 'parent@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: false,
      } as User);

      // Act
      await useCase.execute('user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN']);

      // Assert
      expect(mockUserRepository.deactivate).toHaveBeenCalledWith('parent-user-1');
      expect(mockLockUser).toHaveBeenCalledTimes(1); // Only for student
      expect(mockLockUser).toHaveBeenCalledWith('clerk-student-1');
    });

    it('should handle multiple parents linked to student', async () => {
      // Arrange
      const studentUser = User.create({
        id: 'user-1',
        email: 'student@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
        clerkId: 'clerk-student-1',
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(studentUser);
      vi.mocked(mockUserRepository.deactivate).mockResolvedValue(studentUser);
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { name: 'STUDENT' } },
      ]);
      mockPrisma.student.findUnique.mockResolvedValue({
        id: 'student-1',
        userId: 'user-1',
        userStudents: [
          {
            userId: 'parent-user-1',
            user: { id: 'parent-user-1' },
          },
          {
            userId: 'parent-user-2',
            user: { id: 'parent-user-2' },
          },
        ],
      });
      // Both parents have no other active students (query returns the student being deactivated, which gets filtered out)
      mockPrisma.userStudent.findMany
        .mockResolvedValueOnce([
          {
            userId: 'parent-user-1',
            student: {
              id: 'student-1', // Will be filtered out
              user: { id: 'user-1', isActive: true },
            },
          },
        ]) // parent-user-1: after filtering, has no other students
        .mockResolvedValueOnce([
          {
            userId: 'parent-user-2',
            student: {
              id: 'student-1', // Will be filtered out
              user: { id: 'user-1', isActive: true },
            },
          },
        ]); // parent-user-2: after filtering, has no other students
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'parent-user-1', clerkId: 'clerk-parent-1' })
        .mockResolvedValueOnce({ id: 'parent-user-2', clerkId: 'clerk-parent-2' });
      vi.mocked(mockUserRepository.deactivate)
        .mockResolvedValueOnce(studentUser)
        .mockResolvedValueOnce({ id: 'parent-user-1' } as User)
        .mockResolvedValueOnce({ id: 'parent-user-2' } as User);

      // Act
      await useCase.execute('user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN']);

      // Assert
      expect(mockUserRepository.deactivate).toHaveBeenCalledTimes(3);
      expect(mockUserRepository.deactivate).toHaveBeenCalledWith('user-1');
      expect(mockUserRepository.deactivate).toHaveBeenCalledWith('parent-user-1');
      expect(mockUserRepository.deactivate).toHaveBeenCalledWith('parent-user-2');
      expect(mockLockUser).toHaveBeenCalledTimes(3);
    });

    it('should only consider active, non-deleted students when checking parent status', async () => {
      // Arrange
      const studentUser = User.create({
        id: 'user-1',
        email: 'student@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
        clerkId: 'clerk-student-1',
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(studentUser);
      vi.mocked(mockUserRepository.deactivate).mockResolvedValue(studentUser);
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { name: 'STUDENT' } },
      ]);
      mockPrisma.student.findUnique.mockResolvedValue({
        id: 'student-1',
        userId: 'user-1',
        userStudents: [
          {
            userId: 'parent-user-1',
            user: { id: 'parent-user-1' },
          },
        ],
      });
      // The Prisma query filters for deletedAt: null and isActive: true at the database level
      // So the mock should only return active, non-deleted students
      // In this case, only the student being deactivated is returned (which will be filtered out in code)
      // Note: Deleted and inactive students are filtered by Prisma query, so they won't be in the result
      mockPrisma.userStudent.findMany.mockResolvedValue([
        {
          userId: 'parent-user-1',
          student: {
            id: 'student-1', // Being deactivated - will be filtered out in code
            deletedAt: null, // Not deleted (would be filtered by Prisma query)
            user: { id: 'user-1', isActive: true }, // Active (would be filtered by Prisma query)
          },
        },
        // student-2 is deleted, so Prisma query filters it out - not in mock result
        // student-3 is inactive, so Prisma query filters it out - not in mock result
      ]);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'parent-user-1',
        clerkId: 'clerk-parent-1',
      });
      vi.mocked(mockUserRepository.deactivate).mockResolvedValueOnce(studentUser).mockResolvedValueOnce({
        id: 'parent-user-1',
        email: 'parent@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: false,
      } as User);

      // Act
      await useCase.execute('user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN']);

      // Assert
      // Parent should be deactivated because after filtering out the student being deactivated,
      // parent has no other active students (deleted/inactive students were already filtered by Prisma query)
      expect(mockUserRepository.deactivate).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.deactivate).toHaveBeenCalledWith('parent-user-1');
    });

    it('should exclude student being deactivated from parent active student count', async () => {
      // Arrange
      const studentUser = User.create({
        id: 'user-1',
        email: 'student@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
        clerkId: 'clerk-student-1',
      });

      vi.mocked(mockUserRepository.findById).mockResolvedValue(studentUser);
      vi.mocked(mockUserRepository.deactivate).mockResolvedValue(studentUser);
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { name: 'STUDENT' } },
      ]);
      mockPrisma.student.findUnique.mockResolvedValue({
        id: 'student-1',
        userId: 'user-1',
        userStudents: [
          {
            userId: 'parent-user-1',
            user: { id: 'parent-user-1' },
          },
        ],
      });
      // Query returns only the student being deactivated
      // After filtering it out, parent has no other active students
      mockPrisma.userStudent.findMany.mockResolvedValue([
        {
          userId: 'parent-user-1',
          student: {
            id: 'student-1', // This is the student being deactivated
            user: { id: 'user-1', isActive: true },
          },
        },
      ]);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'parent-user-1',
        clerkId: 'clerk-parent-1',
      });
      vi.mocked(mockUserRepository.deactivate).mockResolvedValueOnce(studentUser).mockResolvedValueOnce({
        id: 'parent-user-1',
        email: 'parent@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: false,
      } as User);

      // Act
      await useCase.execute('user-1', 'admin-user-id', TEST_CONSTANTS.SCHOOL_ID, ['SCHOOL_ADMIN']);

      // Assert
      // Parent should be deactivated because the only student they have is the one being deactivated
      expect(mockUserRepository.deactivate).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.deactivate).toHaveBeenCalledWith('parent-user-1');
    });
  });
});

