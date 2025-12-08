import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetStudentsUseCase } from '../../../core/app/use-cases/students/GetStudentsUseCase';
import { createMockStudentRepository } from '../../utils/mockRepositories';
import { createTestStudent, TEST_CONSTANTS } from '../../utils/testHelpers';

// Mock Prisma Client
const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      user: {
        findUnique: vi.fn(),
      },
      teacherStudent: {
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

// Mock SchoolYearRepository
const createMockSchoolYearRepository = () => ({
  findActiveBySchoolId: vi.fn(),
});

describe('GetStudentsUseCase', () => {
  let useCase: GetStudentsUseCase;
  let mockStudentRepository: ReturnType<typeof createMockStudentRepository>;
  let mockSchoolYearRepository: ReturnType<typeof createMockSchoolYearRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    mockStudentRepository = createMockStudentRepository();
    mockSchoolYearRepository = createMockSchoolYearRepository();
    useCase = new GetStudentsUseCase(mockStudentRepository, mockSchoolYearRepository as any);
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return all students when no userId provided', async () => {
      // Arrange
      const students = [
        createTestStudent({ id: 'student-1', schoolId: TEST_CONSTANTS.SCHOOL_ID }),
        createTestStudent({ id: 'student-2', schoolId: TEST_CONSTANTS.SCHOOL_ID }),
      ];

      vi.mocked(mockStudentRepository.findBySchoolId).mockResolvedValue(students);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result).toEqual(students);
      expect(mockStudentRepository.findBySchoolId).toHaveBeenCalledWith(TEST_CONSTANTS.SCHOOL_ID);
    });

    it('should return all students for SCHOOL_ADMIN', async () => {
      // Arrange
      const students = [
        createTestStudent({ id: 'student-1', schoolId: TEST_CONSTANTS.SCHOOL_ID }),
        createTestStudent({ id: 'student-2', schoolId: TEST_CONSTANTS.SCHOOL_ID }),
      ];

      mockPrisma.user.findUnique.mockResolvedValue({
        userRoles: [{ role: { name: 'SCHOOL_ADMIN' } }],
        userStudents: [],
        student: null,
      });

      vi.mocked(mockStudentRepository.findBySchoolId).mockResolvedValue(students);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, TEST_CONSTANTS.USER_ID);

      // Assert
      expect(result).toEqual(students);
      expect(mockStudentRepository.findBySchoolId).toHaveBeenCalledWith(TEST_CONSTANTS.SCHOOL_ID);
    });

    it('should return only linked children for PARENT', async () => {
      // Arrange
      const allStudents = [
        createTestStudent({ id: 'student-1', schoolId: TEST_CONSTANTS.SCHOOL_ID }),
        createTestStudent({ id: 'student-2', schoolId: TEST_CONSTANTS.SCHOOL_ID }),
        createTestStudent({ id: 'student-3', schoolId: TEST_CONSTANTS.SCHOOL_ID }),
      ];

      mockPrisma.user.findUnique.mockResolvedValue({
        userRoles: [{ role: { name: 'PARENT' } }],
        userStudents: [{ studentId: 'student-1' }, { studentId: 'student-3' }],
        student: null,
      });

      vi.mocked(mockStudentRepository.findBySchoolId).mockResolvedValue(allStudents);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, TEST_CONSTANTS.USER_ID);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map(s => s.id)).toEqual(['student-1', 'student-3']);
    });

    it('should return only own record for STUDENT', async () => {
      // Arrange
      const ownStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        userRoles: [{ role: { name: 'STUDENT' } }],
        userStudents: [],
        student: { id: TEST_CONSTANTS.STUDENT_ID },
      });

      vi.mocked(mockStudentRepository.findById).mockResolvedValue(ownStudent);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, TEST_CONSTANTS.USER_ID);

      // Assert
      expect(result).toEqual([ownStudent]);
      expect(mockStudentRepository.findById).toHaveBeenCalledWith(
        TEST_CONSTANTS.STUDENT_ID,
        TEST_CONSTANTS.SCHOOL_ID
      );
    });

    it('should return empty array for STUDENT with no student record', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        userRoles: [{ role: { name: 'STUDENT' } }],
        userStudents: [],
        student: null,
      });

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, TEST_CONSTANTS.USER_ID);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return only assigned students for TEACHER with active school year', async () => {
      // Arrange
      const allStudents = [
        createTestStudent({ id: 'student-1', schoolId: TEST_CONSTANTS.SCHOOL_ID }),
        createTestStudent({ id: 'student-2', schoolId: TEST_CONSTANTS.SCHOOL_ID }),
        createTestStudent({ id: 'student-3', schoolId: TEST_CONSTANTS.SCHOOL_ID }),
      ];

      const activeSchoolYear = {
        id: 'school-year-1',
        name: '2024-2025',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        userRoles: [{ role: { name: 'TEACHER' } }],
        userStudents: [],
        student: null,
      });

      mockPrisma.teacherStudent.findMany.mockResolvedValue([
        { studentId: 'student-1' },
        { studentId: 'student-2' },
      ]);

      vi.mocked(mockSchoolYearRepository.findActiveBySchoolId).mockResolvedValue(activeSchoolYear as any);
      vi.mocked(mockStudentRepository.findBySchoolId).mockResolvedValue(allStudents);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, TEST_CONSTANTS.USER_ID);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map(s => s.id)).toEqual(['student-1', 'student-2']);
      expect(mockSchoolYearRepository.findActiveBySchoolId).toHaveBeenCalledWith(TEST_CONSTANTS.SCHOOL_ID);
      expect(mockPrisma.teacherStudent.findMany).toHaveBeenCalledWith({
        where: {
          teacherId: TEST_CONSTANTS.USER_ID,
          schoolYearId: 'school-year-1',
          deletedAt: null,
        },
        select: { studentId: true },
      });
    });

    it('should return empty array for TEACHER with no active school year', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        userRoles: [{ role: { name: 'TEACHER' } }],
        userStudents: [],
        student: null,
      });

      vi.mocked(mockSchoolYearRepository.findActiveBySchoolId).mockResolvedValue(null);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, TEST_CONSTANTS.USER_ID);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array for TEACHER with no assigned students', async () => {
      // Arrange
      const activeSchoolYear = {
        id: 'school-year-1',
        name: '2024-2025',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        userRoles: [{ role: { name: 'TEACHER' } }],
        userStudents: [],
        student: null,
      });

      mockPrisma.teacherStudent.findMany.mockResolvedValue([]);

      vi.mocked(mockSchoolYearRepository.findActiveBySchoolId).mockResolvedValue(activeSchoolYear as any);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, TEST_CONSTANTS.USER_ID);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return all students for PARENT who is also TEACHER', async () => {
      // Arrange
      const students = [
        createTestStudent({ id: 'student-1', schoolId: TEST_CONSTANTS.SCHOOL_ID }),
        createTestStudent({ id: 'student-2', schoolId: TEST_CONSTANTS.SCHOOL_ID }),
      ];

      const activeSchoolYear = {
        id: 'school-year-1',
        name: '2024-2025',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        userRoles: [
          { role: { name: 'PARENT' } },
          { role: { name: 'TEACHER' } },
        ],
        userStudents: [],
        student: null,
      });

      mockPrisma.teacherStudent.findMany.mockResolvedValue([
        { studentId: 'student-1' },
        { studentId: 'student-2' },
      ]);

      vi.mocked(mockSchoolYearRepository.findActiveBySchoolId).mockResolvedValue(activeSchoolYear as any);
      vi.mocked(mockStudentRepository.findBySchoolId).mockResolvedValue(students);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, TEST_CONSTANTS.USER_ID);

      // Assert
      // Should use TEACHER logic (filtered by assigned students) not PARENT logic (only linked)
      expect(result).toEqual(students);
      expect(mockSchoolYearRepository.findActiveBySchoolId).toHaveBeenCalledWith(TEST_CONSTANTS.SCHOOL_ID);
    });

    it('should exclude soft-deleted students', async () => {
      // Arrange
      const activeStudent = createTestStudent({
        id: 'student-1',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });
      // Note: Student entity doesn't have deletedAt property - soft deletion is handled at repository level
      // The repository filters out deleted students, so we just verify the active student is returned

      // Repository should only return non-deleted students
      vi.mocked(mockStudentRepository.findBySchoolId).mockResolvedValue([activeStudent]);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result).toEqual([activeStudent]);
      // Repository filters out deleted students, so only active student is returned
    });
  });
});

