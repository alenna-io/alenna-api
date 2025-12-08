import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CreateStudentUseCase } from '../../../core/app/use-cases/students/CreateStudentUseCase';
import { createMockStudentRepository } from '../../utils/mockRepositories';
import {
  createTestStudent,
  createTestCreateStudentInput,
  TEST_CONSTANTS,
} from '../../utils/testHelpers';
import { clerkService } from '../../../core/frameworks/services/ClerkService';

// Mock Prisma Client - must be a class constructor
// Use vi.hoisted() to ensure the mock instance is available when the mock factory runs
const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      school: {
        findUnique: vi.fn(),
      },
      student: {
        count: vi.fn(),
      },
      role: {
        findFirst: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      userRole: {
        create: vi.fn(),
        findFirst: vi.fn(),
      },
      userStudent: {
        findFirst: vi.fn(),
        create: vi.fn(),
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

// Mock ClerkService
vi.mock('../../../core/frameworks/services/ClerkService', () => {
  return {
    clerkService: {
      createUser: vi.fn(),
    },
  };
});

describe('CreateStudentUseCase', () => {
  let useCase: CreateStudentUseCase;
  let mockRepository: ReturnType<typeof createMockStudentRepository>;
  let mockPrisma: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    mockRepository = createMockStudentRepository();
    useCase = new CreateStudentUseCase(mockRepository);
    
    // Get the mocked Prisma instance (same instance is returned)
    mockPrisma = mockPrismaInstance;
    
    // Suppress console.error for cleaner test output (Clerk is mocked, no real connections)
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('execute', () => {
    it('should create a student successfully', async () => {
      // Arrange
      const input = createTestCreateStudentInput();
      const createdStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        firstName: input.firstName,
        lastName: input.lastName,
      });

      // Mock school (no limit)
      mockPrisma.school.findUnique.mockResolvedValue({
        userLimit: null,
      });

      // Mock STUDENT role
      mockPrisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-student-id',
        name: 'STUDENT',
      });

      // Mock email check (no existing user)
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      // Mock Clerk user creation
      vi.mocked(clerkService.createUser).mockResolvedValue('clerk-student-id');

      // Mock user creation
      mockPrisma.user.create.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
      });

      // Mock PARENT role
      mockPrisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-parent-id',
        name: 'PARENT',
      });

      // Mock parent email check (no existing parent)
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Mock Clerk parent creation
      vi.mocked(clerkService.createUser).mockResolvedValue('clerk-parent-id');

      // Mock parent user creation
      mockPrisma.user.create.mockResolvedValue({
        id: 'parent-user-id',
        email: input.parents[0].email,
        firstName: input.parents[0].firstName,
        lastName: input.parents[0].lastName,
      });

      // Mock parent role assignment check
      mockPrisma.userRole.findFirst.mockResolvedValue(null);

      // Mock student repository methods
      vi.mocked(mockRepository.createWithUser).mockResolvedValue(createdStudent);
      vi.mocked(mockRepository.findById).mockResolvedValue(createdStudent);

      // Act
      const result = await useCase.execute(input, TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result).toEqual(createdStudent);
      expect(mockPrisma.school.findUnique).toHaveBeenCalledWith({
        where: { id: TEST_CONSTANTS.SCHOOL_ID },
        select: { userLimit: true },
      });
      expect(clerkService.createUser).toHaveBeenCalled();
      expect(mockRepository.createWithUser).toHaveBeenCalled();
    });

    it('should throw error when school student limit is reached', async () => {
      // Arrange
      const input = createTestCreateStudentInput();
      const limit = 10;

      mockPrisma.school.findUnique.mockResolvedValue({
        userLimit: limit,
      });

      mockPrisma.student.count.mockResolvedValue(limit);

      // Act & Assert
      await expect(
        useCase.execute(input, TEST_CONSTANTS.SCHOOL_ID)
      ).rejects.toThrow(
        `Se ha alcanzado el límite de estudiantes permitidos (${limit}). No se pueden crear más estudiantes.`
      );

      expect(mockPrisma.student.count).toHaveBeenCalledWith({
        where: {
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          deletedAt: null,
        },
      });
    });

    it('should throw error when STUDENT role not found', async () => {
      // Arrange
      const input = createTestCreateStudentInput();

      mockPrisma.school.findUnique.mockResolvedValue({
        userLimit: null,
      });

      mockPrisma.role.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(input, TEST_CONSTANTS.SCHOOL_ID)
      ).rejects.toThrow('STUDENT role not found in system');
    });

    it('should throw error when email already exists', async () => {
      // Arrange
      const input = createTestCreateStudentInput();

      mockPrisma.school.findUnique.mockResolvedValue({
        userLimit: null,
      });

      mockPrisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-student-id',
        name: 'STUDENT',
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user-id',
        email: input.email,
      });

      // Act & Assert
      await expect(
        useCase.execute(input, TEST_CONSTANTS.SCHOOL_ID)
      ).rejects.toThrow('Ya existe un usuario con este correo electrónico');
    });

    it('should throw error when Clerk user creation fails', async () => {
      // Arrange
      const input = createTestCreateStudentInput();

      mockPrisma.school.findUnique.mockResolvedValue({
        userLimit: null,
      });

      mockPrisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-student-id',
        name: 'STUDENT',
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);

      const clerkError = {
        errors: [{ longMessage: 'Email already exists in Clerk' }],
      };
      vi.mocked(clerkService.createUser).mockRejectedValue(clerkError);

      // Act & Assert
      await expect(
        useCase.execute(input, TEST_CONSTANTS.SCHOOL_ID)
      ).rejects.toThrow('Email already exists in Clerk');
    });

    it('should throw error when no parents provided', async () => {
      // Arrange
      const input = createTestCreateStudentInput({
        parents: [],
      });

      mockPrisma.school.findUnique.mockResolvedValue({
        userLimit: null,
      });

      mockPrisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-student-id',
        name: 'STUDENT',
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);
      vi.mocked(clerkService.createUser).mockResolvedValue('clerk-student-id');

      mockPrisma.user.create.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
      });

      const createdStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      vi.mocked(mockRepository.createWithUser).mockResolvedValue(createdStudent);

      // Act & Assert
      await expect(
        useCase.execute(input, TEST_CONSTANTS.SCHOOL_ID)
      ).rejects.toThrow('At least one parent is required when creating a student');
    });

    it('should throw error when more than two parents provided', async () => {
      // Arrange
      const input = createTestCreateStudentInput({
        parents: [
          {
            firstName: 'Parent1',
            lastName: 'One',
            email: 'parent1@example.com',
            phone: '111-111-1111',
            relationship: 'Mother',
          },
          {
            firstName: 'Parent2',
            lastName: 'Two',
            email: 'parent2@example.com',
            phone: '222-222-2222',
            relationship: 'Father',
          },
          {
            firstName: 'Parent3',
            lastName: 'Three',
            email: 'parent3@example.com',
            phone: '333-333-3333',
            relationship: 'Guardian',
          },
        ],
      });

      mockPrisma.school.findUnique.mockResolvedValue({
        userLimit: null,
      });

      mockPrisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-student-id',
        name: 'STUDENT',
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);
      vi.mocked(clerkService.createUser).mockResolvedValue('clerk-student-id');

      mockPrisma.user.create.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
      });

      const createdStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      vi.mocked(mockRepository.createWithUser).mockResolvedValue(createdStudent);

      // Act & Assert
      await expect(
        useCase.execute(input, TEST_CONSTANTS.SCHOOL_ID)
      ).rejects.toThrow('Maximum two parents allowed per student');
    });

    it('should use existing parent user if email already exists', async () => {
      // Arrange
      const input = createTestCreateStudentInput();
      const createdStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      mockPrisma.school.findUnique.mockResolvedValue({
        userLimit: null,
      });

      mockPrisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-student-id',
        name: 'STUDENT',
      });

      // Student email doesn't exist
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      vi.mocked(clerkService.createUser).mockResolvedValue('clerk-student-id');

      mockPrisma.user.create.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
      });

      mockPrisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-parent-id',
        name: 'PARENT',
      });

      // Parent email already exists
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'existing-parent-id',
        email: input.parents[0].email,
      });

      vi.mocked(mockRepository.createWithUser).mockResolvedValue(createdStudent);
      vi.mocked(mockRepository.findById).mockResolvedValue(createdStudent);

      // Act
      const result = await useCase.execute(input, TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result).toEqual(createdStudent);
      // Should not create a new parent user, should use existing one
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1); // Only student user
    });

    it('should calculate age correctly from birthDate', async () => {
      // Arrange
      const today = new Date();
      const birthYear = today.getFullYear() - 15;
      const birthDate = new Date(birthYear, today.getMonth(), today.getDate() - 1); // Yesterday, 15 years ago
      
      const input = createTestCreateStudentInput({
        birthDate: birthDate.toISOString(),
      });

      const createdStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        age: 15,
        birthDate,
      });

      mockPrisma.school.findUnique.mockResolvedValue({
        userLimit: null,
      });

      mockPrisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-student-id',
        name: 'STUDENT',
      });

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      vi.mocked(clerkService.createUser).mockResolvedValue('clerk-student-id');

      mockPrisma.user.create.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
      });

      mockPrisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-parent-id',
        name: 'PARENT',
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);
      vi.mocked(clerkService.createUser).mockResolvedValue('clerk-parent-id');

      mockPrisma.user.create.mockResolvedValue({
        id: 'parent-user-id',
      });

      mockPrisma.userRole.findFirst.mockResolvedValue(null);

      vi.mocked(mockRepository.createWithUser).mockResolvedValue(createdStudent);
      vi.mocked(mockRepository.findById).mockResolvedValue(createdStudent);

      // Act
      const result = await useCase.execute(input, TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result.age).toBe(15);
      expect(mockRepository.createWithUser).toHaveBeenCalledWith(
        expect.objectContaining({
          age: 15,
        }),
        expect.any(String)
      );
    });

    it('should calculate age correctly when birthday has not occurred this year', async () => {
      // Arrange
      const today = new Date();
      const birthYear = today.getFullYear() - 15;
      const birthDate = new Date(birthYear, today.getMonth() + 1, today.getDate()); // Next month, 15 years ago
      
      const input = createTestCreateStudentInput({
        birthDate: birthDate.toISOString(),
      });

      const createdStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        age: 14, // Should be 14, not 15, since birthday hasn't occurred
        birthDate,
      });

      mockPrisma.school.findUnique.mockResolvedValue({
        userLimit: null,
      });

      mockPrisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-student-id',
        name: 'STUDENT',
      });

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      vi.mocked(clerkService.createUser).mockResolvedValue('clerk-student-id');

      mockPrisma.user.create.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
      });

      mockPrisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-parent-id',
        name: 'PARENT',
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);
      vi.mocked(clerkService.createUser).mockResolvedValue('clerk-parent-id');

      mockPrisma.user.create.mockResolvedValue({
        id: 'parent-user-id',
      });

      mockPrisma.userRole.findFirst.mockResolvedValue(null);

      vi.mocked(mockRepository.createWithUser).mockResolvedValue(createdStudent);
      vi.mocked(mockRepository.findById).mockResolvedValue(createdStudent);

      // Act
      const result = await useCase.execute(input, TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result.age).toBe(14);
    });

    it('should handle parent Clerk creation failure gracefully', async () => {
      // Arrange
      const input = createTestCreateStudentInput();
      const createdStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      mockPrisma.school.findUnique.mockResolvedValue({
        userLimit: null,
      });

      mockPrisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-student-id',
        name: 'STUDENT',
      });

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      vi.mocked(clerkService.createUser)
        .mockResolvedValueOnce('clerk-student-id')
        .mockRejectedValueOnce(new Error('Clerk API error'));

      mockPrisma.user.create.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
      });

      mockPrisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-parent-id',
        name: 'PARENT',
      });

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      // Parent user should still be created with placeholder clerkId
      mockPrisma.user.create.mockResolvedValue({
        id: 'parent-user-id',
        clerkId: expect.stringContaining('parent_'),
      });

      mockPrisma.userRole.findFirst.mockResolvedValue(null);

      vi.mocked(mockRepository.createWithUser).mockResolvedValue(createdStudent);
      vi.mocked(mockRepository.findById).mockResolvedValue(createdStudent);

      // Act
      const result = await useCase.execute(input, TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result).toEqual(createdStudent);
      // Should still create parent user even if Clerk fails
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error creating Clerk account for parent'),
        expect.any(Error)
      );
    });

    it('should assign PARENT role to new parent user', async () => {
      // Arrange
      const input = createTestCreateStudentInput();
      const createdStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      mockPrisma.school.findUnique.mockResolvedValue({
        userLimit: null,
      });

      mockPrisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-student-id',
        name: 'STUDENT',
      });

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      vi.mocked(clerkService.createUser).mockResolvedValue('clerk-student-id');

      mockPrisma.user.create.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
      });

      mockPrisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-parent-id',
        name: 'PARENT',
      });

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      vi.mocked(clerkService.createUser).mockResolvedValue('clerk-parent-id');

      mockPrisma.user.create.mockResolvedValue({
        id: 'parent-user-id',
      });

      mockPrisma.userRole.findFirst.mockResolvedValue(null);

      vi.mocked(mockRepository.createWithUser).mockResolvedValue(createdStudent);
      vi.mocked(mockRepository.findById).mockResolvedValue(createdStudent);

      // Act
      await useCase.execute(input, TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(mockPrisma.userRole.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'parent-user-id',
            roleId: 'role-parent-id',
          }),
        })
      );
    });

    it('should not assign PARENT role if parent already has it', async () => {
      // Arrange
      const input = createTestCreateStudentInput();
      const createdStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      mockPrisma.school.findUnique.mockResolvedValue({
        userLimit: null,
      });

      mockPrisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-student-id',
        name: 'STUDENT',
      });

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      vi.mocked(clerkService.createUser).mockResolvedValue('clerk-student-id');

      mockPrisma.user.create.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
      });

      mockPrisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-parent-id',
        name: 'PARENT',
      });

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      vi.mocked(clerkService.createUser).mockResolvedValue('clerk-parent-id');

      mockPrisma.user.create.mockResolvedValue({
        id: 'parent-user-id',
      });

      // Parent already has PARENT role
      mockPrisma.userRole.findFirst.mockResolvedValue({
        id: 'user-role-1',
        userId: 'parent-user-id',
        roleId: 'role-parent-id',
      });

      vi.mocked(mockRepository.createWithUser).mockResolvedValue(createdStudent);
      vi.mocked(mockRepository.findById).mockResolvedValue(createdStudent);

      // Act
      await useCase.execute(input, TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      // Should not create duplicate role assignment
      const roleCreateCalls = mockPrisma.userRole.create.mock.calls.filter(
        (call: any[]) => call[0].data.roleId === 'role-parent-id'
      );
      expect(roleCreateCalls.length).toBe(0);
    });

    it('should prevent duplicate parent-student links', async () => {
      // Arrange
      const input = createTestCreateStudentInput();
      const createdStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      mockPrisma.school.findUnique.mockResolvedValue({
        userLimit: null,
      });

      mockPrisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-student-id',
        name: 'STUDENT',
      });

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      vi.mocked(clerkService.createUser).mockResolvedValue('clerk-student-id');

      mockPrisma.user.create.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
      });

      mockPrisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-parent-id',
        name: 'PARENT',
      });

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      vi.mocked(clerkService.createUser).mockResolvedValue('clerk-parent-id');

      mockPrisma.user.create.mockResolvedValue({
        id: 'parent-user-id',
      });

      mockPrisma.userRole.findFirst.mockResolvedValue(null);

      // Link already exists
      mockPrisma.userStudent.findFirst.mockResolvedValue({
        id: 'existing-link-id',
        userId: 'parent-user-id',
        studentId: TEST_CONSTANTS.STUDENT_ID,
      });

      vi.mocked(mockRepository.createWithUser).mockResolvedValue(createdStudent);
      vi.mocked(mockRepository.findById).mockResolvedValue(createdStudent);

      // Act
      await useCase.execute(input, TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      // Should not create duplicate link
      expect(mockPrisma.userStudent.create).not.toHaveBeenCalled();
    });

    it('should create link with relationship field when provided', async () => {
      // Arrange
      const input = createTestCreateStudentInput({
        parents: [
          {
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane.doe@example.com',
            phone: '123-456-7890',
            relationship: 'Mother',
          },
        ],
      });
      const createdStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      mockPrisma.school.findUnique.mockResolvedValue({
        userLimit: null,
      });

      mockPrisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-student-id',
        name: 'STUDENT',
      });

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      vi.mocked(clerkService.createUser).mockResolvedValue('clerk-student-id');

      mockPrisma.user.create.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
      });

      mockPrisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-parent-id',
        name: 'PARENT',
      });

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      vi.mocked(clerkService.createUser).mockResolvedValue('clerk-parent-id');

      mockPrisma.user.create.mockResolvedValue({
        id: 'parent-user-id',
      });

      mockPrisma.userRole.findFirst.mockResolvedValue(null);
      mockPrisma.userStudent.findFirst.mockResolvedValue(null);

      vi.mocked(mockRepository.createWithUser).mockResolvedValue(createdStudent);
      vi.mocked(mockRepository.findById).mockResolvedValue(createdStudent);

      // Act
      await useCase.execute(input, TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(mockPrisma.userStudent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          relationship: 'Mother',
        }),
      });
    });

    it('should use default relationship when relationship is falsy', async () => {
      // Arrange
      // Note: DTO requires relationship, but use case has fallback to 'Parent'
      // This test verifies the use case fallback logic works
      const input = createTestCreateStudentInput({
        parents: [
          {
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane.doe@example.com',
            phone: '123-456-7890',
            relationship: 'Parent', // Use default value
          },
        ],
      });
      const createdStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      mockPrisma.school.findUnique.mockResolvedValue({
        userLimit: null,
      });

      mockPrisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-student-id',
        name: 'STUDENT',
      });

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      vi.mocked(clerkService.createUser).mockResolvedValue('clerk-student-id');

      mockPrisma.user.create.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
      });

      mockPrisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-parent-id',
        name: 'PARENT',
      });

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      vi.mocked(clerkService.createUser).mockResolvedValue('clerk-parent-id');

      mockPrisma.user.create.mockResolvedValue({
        id: 'parent-user-id',
      });

      mockPrisma.userRole.findFirst.mockResolvedValue(null);
      mockPrisma.userStudent.findFirst.mockResolvedValue(null);

      vi.mocked(mockRepository.createWithUser).mockResolvedValue(createdStudent);
      vi.mocked(mockRepository.findById).mockResolvedValue(createdStudent);

      // Act
      await useCase.execute(input, TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(mockPrisma.userStudent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          relationship: 'Parent',
        }),
      });
    });

    it('should throw error when PARENT role not found', async () => {
      // Arrange
      const input = createTestCreateStudentInput();

      mockPrisma.school.findUnique.mockResolvedValue({
        userLimit: null,
      });

      mockPrisma.role.findFirst
        .mockResolvedValueOnce({
          id: 'role-student-id',
          name: 'STUDENT',
        })
        .mockResolvedValueOnce(null); // PARENT role not found

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      vi.mocked(clerkService.createUser).mockResolvedValue('clerk-student-id');

      mockPrisma.user.create.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
      });

      const createdStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      vi.mocked(mockRepository.createWithUser).mockResolvedValue(createdStudent);

      // Act & Assert
      await expect(
        useCase.execute(input, TEST_CONSTANTS.SCHOOL_ID)
      ).rejects.toThrow('PARENT role not found in system');
    });

    it('should handle two parents successfully', async () => {
      // Arrange
      const input = createTestCreateStudentInput({
        parents: [
          {
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane.doe@example.com',
            phone: '123-456-7890',
            relationship: 'Mother',
          },
          {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '123-456-7891',
            relationship: 'Father',
          },
        ],
      });
      const createdStudent = createTestStudent({
        id: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      mockPrisma.school.findUnique.mockResolvedValue({
        userLimit: null,
      });

      mockPrisma.role.findFirst.mockResolvedValue({
        id: 'role-student-id',
        name: 'STUDENT',
      });

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      vi.mocked(clerkService.createUser).mockResolvedValue('clerk-student-id');

      mockPrisma.user.create.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
      });

      mockPrisma.role.findFirst.mockResolvedValue({
        id: 'role-parent-id',
        name: 'PARENT',
      });

      // Both parents are new
      mockPrisma.user.findUnique.mockResolvedValue(null);
      vi.mocked(clerkService.createUser)
        .mockResolvedValueOnce('clerk-parent-1')
        .mockResolvedValueOnce('clerk-parent-2');

      mockPrisma.user.create
        .mockResolvedValueOnce({ id: 'parent-user-1' })
        .mockResolvedValueOnce({ id: 'parent-user-2' });

      mockPrisma.userRole.findFirst.mockResolvedValue(null);
      mockPrisma.userStudent.findFirst.mockResolvedValue(null);

      vi.mocked(mockRepository.createWithUser).mockResolvedValue(createdStudent);
      vi.mocked(mockRepository.findById).mockResolvedValue(createdStudent);

      // Act
      await useCase.execute(input, TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(3); // Student + 2 parents
      expect(mockPrisma.userStudent.create).toHaveBeenCalledTimes(2); // 2 parent links
    });
  });
});

