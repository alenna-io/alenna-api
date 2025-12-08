import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateStudentUseCase } from '../../../core/app/use-cases/students/UpdateStudentUseCase';
import { createMockStudentRepository } from '../../utils/mockRepositories';
import { createTestStudent, TEST_CONSTANTS } from '../../utils/testHelpers';
import { UpdateStudentInput } from '../../../core/app/dtos';

// Mock Prisma Client - must be a class constructor
// Use vi.hoisted() to ensure the mock instance is available when the mock factory runs
const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
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
        // Return the shared mock instance
        return mockPrismaInstance;
      }
    },
  };
});

describe('UpdateStudentUseCase', () => {
  let useCase: UpdateStudentUseCase;
  let mockRepository: ReturnType<typeof createMockStudentRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    mockRepository = createMockStudentRepository();
    useCase = new UpdateStudentUseCase(mockRepository);
    
    // Get the mocked Prisma instance (same instance is returned)
    mockPrisma = mockPrismaInstance;
  });

  describe('execute', () => {
    it('should update student successfully', async () => {
      // Arrange
      const existingStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        firstName: 'John',
        lastName: 'Doe',
      });

      const updatedStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        firstName: 'Jane',
        lastName: 'Smith',
      });

      const updateInput: UpdateStudentInput = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(existingStudent);
      mockPrisma.student.findUnique.mockResolvedValue({
        userId: TEST_CONSTANTS.USER_ID,
      });
      mockPrisma.user.update.mockResolvedValue({});
      vi.mocked(mockRepository.update).mockResolvedValue(updatedStudent);

      // Act
      const result = await useCase.execute(
        TEST_CONSTANTS.STUDENT_ID,
        updateInput,
        TEST_CONSTANTS.SCHOOL_ID
      );

      // Assert
      expect(result).toEqual(updatedStudent);
      expect(mockRepository.findById).toHaveBeenCalledWith(
        TEST_CONSTANTS.STUDENT_ID,
        TEST_CONSTANTS.SCHOOL_ID
      );
      expect(mockRepository.update).toHaveBeenCalledWith(
        TEST_CONSTANTS.STUDENT_ID,
        expect.objectContaining(updateInput),
        TEST_CONSTANTS.SCHOOL_ID
      );
    });

    it('should throw error when student not found', async () => {
      // Arrange
      vi.mocked(mockRepository.findById).mockResolvedValue(null);
      const updateInput: UpdateStudentInput = {
        firstName: 'Jane',
      };

      // Act & Assert
      await expect(
        useCase.execute(
          TEST_CONSTANTS.STUDENT_ID,
          updateInput,
          TEST_CONSTANTS.SCHOOL_ID
        )
      ).rejects.toThrow('Student not found');

      expect(mockRepository.findById).toHaveBeenCalledWith(
        TEST_CONSTANTS.STUDENT_ID,
        TEST_CONSTANTS.SCHOOL_ID
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should update user contact information when provided', async () => {
      // Arrange
      const existingStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      const updatedStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      const updateInput: UpdateStudentInput = {
        phone: '555-1234',
        streetAddress: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        country: 'USA',
        zipCode: '62701',
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(existingStudent);
      mockPrisma.student.findUnique.mockResolvedValue({
        userId: TEST_CONSTANTS.USER_ID,
      });
      mockPrisma.user.update.mockResolvedValue({});
      vi.mocked(mockRepository.update).mockResolvedValue(updatedStudent);

      // Act
      await useCase.execute(
        TEST_CONSTANTS.STUDENT_ID,
        updateInput,
        TEST_CONSTANTS.SCHOOL_ID
      );

      // Assert
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: TEST_CONSTANTS.USER_ID },
        data: {
          phone: '555-1234',
          streetAddress: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          country: 'USA',
          zipCode: '62701',
        },
      });
    });

    it('should convert date strings to Date objects', async () => {
      // Arrange
      const existingStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      const updatedStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        birthDate: new Date('2011-01-01'),
        graduationDate: new Date('2029-06-01'),
      });

      const updateInput: UpdateStudentInput = {
        birthDate: '2011-01-01T00:00:00.000Z',
        graduationDate: '2029-06-01T00:00:00.000Z',
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(existingStudent);
      mockPrisma.student.findUnique.mockResolvedValue({
        userId: TEST_CONSTANTS.USER_ID,
      });
      vi.mocked(mockRepository.update).mockResolvedValue(updatedStudent);

      // Act
      await useCase.execute(
        TEST_CONSTANTS.STUDENT_ID,
        updateInput,
        TEST_CONSTANTS.SCHOOL_ID
      );

      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith(
        TEST_CONSTANTS.STUDENT_ID,
        expect.objectContaining({
          birthDate: expect.any(Date),
          graduationDate: expect.any(Date),
        }),
        TEST_CONSTANTS.SCHOOL_ID
      );
    });

    it('should throw error when student record not found in database', async () => {
      // Arrange
      const existingStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(existingStudent);
      mockPrisma.student.findUnique.mockResolvedValue(null);
      const updateInput: UpdateStudentInput = {
        firstName: 'Jane',
      };

      // Act & Assert
      await expect(
        useCase.execute(
          TEST_CONSTANTS.STUDENT_ID,
          updateInput,
          TEST_CONSTANTS.SCHOOL_ID
        )
      ).rejects.toThrow('Student record not found');
    });

    it('should update level information (isLeveled, expectedLevel, currentLevel)', async () => {
      // Arrange
      const existingStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isLeveled: false,
      });

      const updatedStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isLeveled: true,
        expectedLevel: 'L8',
        currentLevel: 'L7',
      });

      const updateInput: UpdateStudentInput = {
        isLeveled: true,
        expectedLevel: 'L8',
        currentLevel: 'L7',
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(existingStudent);
      mockPrisma.student.findUnique.mockResolvedValue({
        userId: TEST_CONSTANTS.USER_ID,
      });
      vi.mocked(mockRepository.update).mockResolvedValue(updatedStudent);

      // Act
      await useCase.execute(
        TEST_CONSTANTS.STUDENT_ID,
        updateInput,
        TEST_CONSTANTS.SCHOOL_ID
      );

      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith(
        TEST_CONSTANTS.STUDENT_ID,
        expect.objectContaining({
          isLeveled: true,
          expectedLevel: 'L8',
          currentLevel: 'L7',
        }),
        TEST_CONSTANTS.SCHOOL_ID
      );
    });

    it('should update certificationTypeId', async () => {
      // Arrange
      const existingStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        certificationTypeId: 'cert-1',
      });

      const updatedStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        certificationTypeId: 'cert-2',
      });

      const updateInput: UpdateStudentInput = {
        certificationTypeId: 'cert-2',
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(existingStudent);
      mockPrisma.student.findUnique.mockResolvedValue({
        userId: TEST_CONSTANTS.USER_ID,
      });
      vi.mocked(mockRepository.update).mockResolvedValue(updatedStudent);

      // Act
      await useCase.execute(
        TEST_CONSTANTS.STUDENT_ID,
        updateInput,
        TEST_CONSTANTS.SCHOOL_ID
      );

      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith(
        TEST_CONSTANTS.STUDENT_ID,
        expect.objectContaining({
          certificationTypeId: 'cert-2',
        }),
        TEST_CONSTANTS.SCHOOL_ID
      );
    });
  });
});

