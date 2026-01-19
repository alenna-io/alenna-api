import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DeleteStudentUseCase } from '../../../core/app/use-cases/deprecated/students/DeleteStudentUseCase';
import { createMockStudentRepository } from '../../utils/mockRepositories';
import { createTestStudent, TEST_CONSTANTS } from '../../utils/testHelpers';
import { clerkService } from '../../../core/infrastructure/services/ClerkService';

// Mock Prisma Client
const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      student: {
        findUnique: vi.fn(),
      },
      user: {
        update: vi.fn(),
        findUnique: vi.fn(),
      },
      userStudent: {
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
vi.mock('../../../core/frameworks/services/ClerkService', () => {
  return {
    clerkService: {
      deleteUser: vi.fn(),
    },
  };
});

describe('DeleteStudentUseCase', () => {
  let useCase: DeleteStudentUseCase;
  let mockRepository: ReturnType<typeof createMockStudentRepository>;
  let mockPrisma: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    mockRepository = createMockStudentRepository();
    useCase = new DeleteStudentUseCase(mockRepository);
    mockPrisma = mockPrismaInstance;
    // Suppress console.error for cleaner test output (Clerk is mocked, no real connections)
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('execute', () => {
    it('should soft delete student and user for SCHOOL_ADMIN', async () => {
      // Arrange
      const testStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(testStudent);
      mockPrisma.student.findUnique
        .mockResolvedValueOnce({
          id: TEST_CONSTANTS.STUDENT_ID,
          user: {
            id: TEST_CONSTANTS.USER_ID,
            clerkId: 'clerk-student-id',
          },
        })
        .mockResolvedValueOnce({
          id: TEST_CONSTANTS.STUDENT_ID,
          userStudents: [], // No parents linked
        });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.userStudent.findMany.mockResolvedValue([]);
      vi.mocked(mockRepository.delete).mockResolvedValue();
      vi.mocked(clerkService.deleteUser).mockResolvedValue();

      // Act
      await useCase.execute(
        TEST_CONSTANTS.STUDENT_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        ['SCHOOL_ADMIN']
      );

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith(
        TEST_CONSTANTS.STUDENT_ID,
        TEST_CONSTANTS.SCHOOL_ID
      );
      expect(clerkService.deleteUser).toHaveBeenCalledWith('clerk-student-id');
      expect(mockRepository.delete).toHaveBeenCalledWith(
        TEST_CONSTANTS.STUDENT_ID,
        TEST_CONSTANTS.SCHOOL_ID
      );
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: TEST_CONSTANTS.USER_ID },
        data: {
          deletedAt: expect.any(Date),
          isActive: false,
          clerkId: null,
        },
      });
    });

    it('should soft delete student and user for SUPERADMIN', async () => {
      // Arrange
      const testStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(testStudent);
      mockPrisma.student.findUnique
        .mockResolvedValueOnce({
          id: TEST_CONSTANTS.STUDENT_ID,
          user: {
            id: TEST_CONSTANTS.USER_ID,
            clerkId: 'clerk-student-id',
          },
        })
        .mockResolvedValueOnce({
          id: TEST_CONSTANTS.STUDENT_ID,
          userStudents: [], // No parents linked
        });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.userStudent.findMany.mockResolvedValue([]);
      vi.mocked(mockRepository.delete).mockResolvedValue();
      vi.mocked(clerkService.deleteUser).mockResolvedValue();

      // Act
      await useCase.execute(
        TEST_CONSTANTS.STUDENT_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        ['SUPERADMIN']
      );

      // Assert
      expect(clerkService.deleteUser).toHaveBeenCalledWith('clerk-student-id');
      expect(mockRepository.delete).toHaveBeenCalled();
    });

    it('should throw error when student not found', async () => {
      // Arrange
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(
          TEST_CONSTANTS.STUDENT_ID,
          TEST_CONSTANTS.SCHOOL_ID,
          ['SCHOOL_ADMIN']
        )
      ).rejects.toThrow('Student not found');

      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error when student user not found', async () => {
      // Arrange
      const testStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(testStudent);
      mockPrisma.student.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(
          TEST_CONSTANTS.STUDENT_ID,
          TEST_CONSTANTS.SCHOOL_ID,
          ['SCHOOL_ADMIN']
        )
      ).rejects.toThrow('Student user not found');
    });

    it('should handle Clerk deletion failure', async () => {
      // Arrange
      const testStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(testStudent);
      mockPrisma.student.findUnique.mockResolvedValue({
        id: TEST_CONSTANTS.STUDENT_ID,
        user: {
          id: TEST_CONSTANTS.USER_ID,
          clerkId: 'clerk-student-id',
        },
      });

      const clerkError = new Error('Clerk deletion failed');
      vi.mocked(clerkService.deleteUser).mockRejectedValue(clerkError);

      // Act & Assert
      await expect(
        useCase.execute(
          TEST_CONSTANTS.STUDENT_ID,
          TEST_CONSTANTS.SCHOOL_ID,
          ['SCHOOL_ADMIN']
        )
      ).rejects.toThrow('Failed to delete user from Clerk');
    });

    it('should delete parent if they have no other children', async () => {
      // Arrange
      const testStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(testStudent);
      mockPrisma.student.findUnique
        .mockResolvedValueOnce({
          id: TEST_CONSTANTS.STUDENT_ID,
          user: {
            id: TEST_CONSTANTS.USER_ID,
            clerkId: 'clerk-student-id',
          },
        })
        .mockResolvedValueOnce({
          id: TEST_CONSTANTS.STUDENT_ID,
          userStudents: [
            {
              userId: 'parent-user-id',
              user: { id: 'parent-user-id' },
            },
          ],
        });

      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.userStudent.findMany.mockResolvedValue([]); // Parent has no other students
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'parent-user-id',
        clerkId: 'clerk-parent-id',
      });

      vi.mocked(mockRepository.delete).mockResolvedValue();
      vi.mocked(clerkService.deleteUser).mockResolvedValue();

      // Act
      await useCase.execute(
        TEST_CONSTANTS.STUDENT_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        ['SCHOOL_ADMIN']
      );

      // Assert
      expect(clerkService.deleteUser).toHaveBeenCalledTimes(2); // Student + parent
      expect(mockPrisma.user.update).toHaveBeenCalledTimes(2); // Student + parent
    });

    it('should not delete parent if they have other children', async () => {
      // Arrange
      const testStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(testStudent);
      mockPrisma.student.findUnique
        .mockResolvedValueOnce({
          id: TEST_CONSTANTS.STUDENT_ID,
          user: {
            id: TEST_CONSTANTS.USER_ID,
            clerkId: 'clerk-student-id',
          },
        })
        .mockResolvedValueOnce({
          id: TEST_CONSTANTS.STUDENT_ID,
          userStudents: [
            {
              userId: 'parent-user-id',
              user: { id: 'parent-user-id' },
            },
          ],
        });

      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.userStudent.findMany.mockResolvedValue([
        { studentId: 'other-student-id' }, // Parent has another child
      ]);

      vi.mocked(mockRepository.delete).mockResolvedValue();
      vi.mocked(clerkService.deleteUser).mockResolvedValue();

      // Act
      await useCase.execute(
        TEST_CONSTANTS.STUDENT_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        ['SCHOOL_ADMIN']
      );

      // Assert
      expect(clerkService.deleteUser).toHaveBeenCalledTimes(1); // Only student, not parent
      expect(mockPrisma.user.update).toHaveBeenCalledTimes(1); // Only student
    });

    it('should soft delete related projections', async () => {
      // Arrange
      const testStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(testStudent);
      mockPrisma.student.findUnique
        .mockResolvedValueOnce({
          id: TEST_CONSTANTS.STUDENT_ID,
          user: {
            id: TEST_CONSTANTS.USER_ID,
            clerkId: 'clerk-student-id',
          },
        })
        .mockResolvedValueOnce({
          id: TEST_CONSTANTS.STUDENT_ID,
          userStudents: [],
        });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.userStudent.findMany.mockResolvedValue([]);
      vi.mocked(mockRepository.delete).mockResolvedValue();
      vi.mocked(clerkService.deleteUser).mockResolvedValue();

      // Act
      await useCase.execute(
        TEST_CONSTANTS.STUDENT_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        ['SCHOOL_ADMIN']
      );

      // Assert
      // Soft delete is handled by repository.delete which sets deletedAt
      expect(mockRepository.delete).toHaveBeenCalledWith(
        TEST_CONSTANTS.STUDENT_ID,
        TEST_CONSTANTS.SCHOOL_ID
      );
      // User is also soft deleted
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: TEST_CONSTANTS.USER_ID },
        data: {
          deletedAt: expect.any(Date),
          isActive: false,
          clerkId: null,
        },
      });
    });

    it('should handle parent with multiple students where one is being deleted', async () => {
      // Arrange
      const testStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(testStudent);
      mockPrisma.student.findUnique
        .mockResolvedValueOnce({
          id: TEST_CONSTANTS.STUDENT_ID,
          user: {
            id: TEST_CONSTANTS.USER_ID,
            clerkId: 'clerk-student-id',
          },
        })
        .mockResolvedValueOnce({
          id: TEST_CONSTANTS.STUDENT_ID,
          userStudents: [
            {
              userId: 'parent-user-id',
              user: { id: 'parent-user-id' },
            },
          ],
        });

      mockPrisma.user.update.mockResolvedValue({});
      // Parent has another active student (not the one being deleted)
      mockPrisma.userStudent.findMany.mockResolvedValue([
        {
          userId: 'parent-user-id',
          student: {
            id: 'other-student-id', // Different student
            user: { id: 'other-user-id', isActive: true },
          },
        },
      ]);

      vi.mocked(mockRepository.delete).mockResolvedValue();
      vi.mocked(clerkService.deleteUser).mockResolvedValue();

      // Act
      await useCase.execute(
        TEST_CONSTANTS.STUDENT_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        ['SCHOOL_ADMIN']
      );

      // Assert
      // Parent should NOT be deleted since they have another active student
      expect(mockPrisma.user.update).toHaveBeenCalledTimes(1); // Only student
      expect(clerkService.deleteUser).toHaveBeenCalledTimes(1); // Only student
    });
  });
});

