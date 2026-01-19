import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetStudentByIdUseCase } from '../../../core/app/use-cases/deprecated/students/GetStudentByIdUseCase';
import { createMockStudentRepository } from '../../utils/mockRepositories';
import { createTestStudent, TEST_CONSTANTS } from '../../utils/testHelpers';

// Mock Prisma Client - must be a class constructor
// Use vi.hoisted() to ensure the mock instance is available when the mock factory runs
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
        // Return the shared mock instance
        return mockPrismaInstance;
      }
    },
  };
});

describe('GetStudentByIdUseCase', () => {
  let useCase: GetStudentByIdUseCase;
  let mockRepository: ReturnType<typeof createMockStudentRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    mockRepository = createMockStudentRepository();
    useCase = new GetStudentByIdUseCase(mockRepository);

    // Get the mocked Prisma instance (same instance is returned)
    mockPrisma = mockPrismaInstance;
  });

  describe('execute', () => {
    it('should return a student when found', async () => {
      // Arrange
      const testStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(testStudent);

      // Act
      const result = await useCase.execute(
        TEST_CONSTANTS.STUDENT_ID,
        TEST_CONSTANTS.SCHOOL_ID
      );

      // Assert
      expect(result).toEqual(testStudent);
      expect(mockRepository.findById).toHaveBeenCalledWith(
        TEST_CONSTANTS.STUDENT_ID,
        TEST_CONSTANTS.SCHOOL_ID
      );
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should throw error when student not found', async () => {
      // Arrange
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(TEST_CONSTANTS.STUDENT_ID, TEST_CONSTANTS.SCHOOL_ID)
      ).rejects.toThrow('Student not found');

      expect(mockRepository.findById).toHaveBeenCalledWith(
        TEST_CONSTANTS.STUDENT_ID,
        TEST_CONSTANTS.SCHOOL_ID
      );
    });

    it('should allow access when user is a teacher', async () => {
      // Arrange
      const testStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(testStudent);
      mockPrisma.user.findUnique.mockResolvedValue({
        userRoles: [
          {
            role: {
              name: 'TEACHER',
            },
          },
        ],
        userStudents: [],
        student: null,
      });

      // Act
      const result = await useCase.execute(
        TEST_CONSTANTS.STUDENT_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        TEST_CONSTANTS.USER_ID
      );

      // Assert
      expect(result).toEqual(testStudent);
      expect(mockPrisma.user.findUnique).toHaveBeenCalled();
    });

    it('should allow access when user is a school admin', async () => {
      // Arrange
      const testStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(testStudent);
      mockPrisma.user.findUnique.mockResolvedValue({
        userRoles: [
          {
            role: {
              name: 'SCHOOL_ADMIN',
            },
          },
        ],
        userStudents: [],
        student: null,
      });

      // Act
      const result = await useCase.execute(
        TEST_CONSTANTS.STUDENT_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        TEST_CONSTANTS.USER_ID
      );

      // Assert
      expect(result).toEqual(testStudent);
    });

    it('should allow access when parent is linked to student', async () => {
      // Arrange
      const testStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(testStudent);
      mockPrisma.user.findUnique.mockResolvedValue({
        userRoles: [
          {
            role: {
              name: 'PARENT',
            },
          },
        ],
        userStudents: [
          {
            studentId: TEST_CONSTANTS.STUDENT_ID,
          },
        ],
        student: null,
      });

      // Act
      const result = await useCase.execute(
        TEST_CONSTANTS.STUDENT_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        TEST_CONSTANTS.USER_ID
      );

      // Assert
      expect(result).toEqual(testStudent);
    });

    it('should throw error when parent is not linked to student', async () => {
      // Arrange
      const testStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(testStudent);
      mockPrisma.user.findUnique.mockResolvedValue({
        userRoles: [
          {
            role: {
              name: 'PARENT',
            },
          },
        ],
        userStudents: [
          {
            studentId: 'different-student-id',
          },
        ],
        student: null,
      });

      // Act & Assert
      await expect(
        useCase.execute(
          TEST_CONSTANTS.STUDENT_ID,
          TEST_CONSTANTS.SCHOOL_ID,
          TEST_CONSTANTS.USER_ID
        )
      ).rejects.toThrow('No tienes permiso para ver este estudiante');
    });

    it('should allow access when student views their own profile', async () => {
      // Arrange
      const testStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(testStudent);
      mockPrisma.user.findUnique.mockResolvedValue({
        userRoles: [
          {
            role: {
              name: 'STUDENT',
            },
          },
        ],
        userStudents: [],
        student: {
          id: TEST_CONSTANTS.STUDENT_ID,
        },
      });

      // Act
      const result = await useCase.execute(
        TEST_CONSTANTS.STUDENT_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        TEST_CONSTANTS.USER_ID
      );

      // Assert
      expect(result).toEqual(testStudent);
    });

    it('should throw error when student tries to view another student', async () => {
      // Arrange
      const testStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(testStudent);
      mockPrisma.user.findUnique.mockResolvedValue({
        userRoles: [
          {
            role: {
              name: 'STUDENT',
            },
          },
        ],
        userStudents: [],
        student: {
          id: 'different-student-id',
        },
      });

      // Act & Assert
      await expect(
        useCase.execute(
          TEST_CONSTANTS.STUDENT_ID,
          TEST_CONSTANTS.SCHOOL_ID,
          TEST_CONSTANTS.USER_ID
        )
      ).rejects.toThrow('No tienes permiso para ver este estudiante');
    });
  });
});

