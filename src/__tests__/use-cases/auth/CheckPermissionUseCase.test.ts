import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckPermissionUseCase } from '../../../core/app/use-cases/auth/CheckPermissionUseCase';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

// Mock Prisma Client
const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      user: {
        findUnique: vi.fn(),
      },
      schoolModule: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      module: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      roleModuleSchool: {
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

describe('CheckPermissionUseCase', () => {
  let useCase: CheckPermissionUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    useCase = new CheckPermissionUseCase();
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return false for invalid permission', async () => {
      // Arrange
      const input = {
        userId: TEST_CONSTANTS.USER_ID,
        permission: 'invalid.permission',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      // Arrange
      const input = {
        userId: TEST_CONSTANTS.USER_ID,
        permission: 'students.read',
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when user has no roles', async () => {
      // Arrange
      const input = {
        userId: TEST_CONSTANTS.USER_ID,
        permission: 'students.read',
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        userRoles: [],
        userStudents: [],
        student: null,
      });

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for SUPERADMIN with any permission', async () => {
      // Arrange
      const input = {
        userId: TEST_CONSTANTS.USER_ID,
        permission: 'students.read',
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        userRoles: [
          {
            role: {
              id: 'role-1',
              name: 'SUPERADMIN',
            },
          },
        ],
        userStudents: [],
        student: null,
      });

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for global scope permission when user has role', async () => {
      // Arrange
      const input = {
        userId: TEST_CONSTANTS.USER_ID,
        permission: 'schools.read',
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        userRoles: [
          {
            role: {
              id: 'role-1',
              name: 'SUPERADMIN',
            },
          },
        ],
        userStudents: [],
        student: null,
      });

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when module not enabled for school', async () => {
      // Arrange
      const input = {
        userId: TEST_CONSTANTS.USER_ID,
        permission: 'students.read',
      };

      const mockModule = {
        id: 'module-1',
        key: 'students',
        name: 'Students',
        description: null,
        displayOrder: 1,
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        userRoles: [
          {
            role: {
              id: 'role-1',
              name: 'TEACHER',
            },
          },
        ],
        userStudents: [],
        student: null,
      });

      mockPrisma.module.findUnique.mockResolvedValue(mockModule);
      mockPrisma.schoolModule.findUnique.mockResolvedValue(null); // Module not enabled

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when module dependency not enabled', async () => {
      // Arrange
      const input = {
        userId: TEST_CONSTANTS.USER_ID,
        permission: 'monthlyAssignment.read',
      };

      const mockModule = {
        id: 'module-2',
        key: 'monthlyAssignments',
        name: 'Monthly Assignments',
        description: null,
        displayOrder: 2,
      };

      const mockDependencyModule = {
        id: 'module-1',
        key: 'projections',
        name: 'Projections',
        description: null,
        displayOrder: 1,
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        userRoles: [
          {
            role: {
              id: 'role-1',
              name: 'TEACHER',
            },
          },
        ],
        userStudents: [],
        student: null,
      });

      mockPrisma.module.findUnique
        .mockResolvedValueOnce(mockModule) // Main module
        .mockResolvedValueOnce(mockDependencyModule); // Dependency module

      mockPrisma.schoolModule.findUnique
        .mockResolvedValueOnce({ isActive: true }) // Main module enabled
        .mockResolvedValueOnce(null); // Dependency not enabled

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when role not assigned to module', async () => {
      // Arrange
      const input = {
        userId: TEST_CONSTANTS.USER_ID,
        permission: 'students.read',
      };

      const mockModule = {
        id: 'module-1',
        key: 'students',
        name: 'Students',
        description: null,
        displayOrder: 1,
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        userRoles: [
          {
            role: {
              id: 'role-1',
              name: 'TEACHER',
            },
          },
        ],
        userStudents: [],
        student: null,
      });

      mockPrisma.module.findUnique.mockResolvedValue(mockModule);
      mockPrisma.schoolModule.findUnique.mockResolvedValue({ isActive: true });
      mockPrisma.roleModuleSchool.findMany.mockResolvedValue([]); // No role assignments

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for school scope permission when all conditions met', async () => {
      // Arrange
      const input = {
        userId: TEST_CONSTANTS.USER_ID,
        permission: 'students.read',
      };

      const mockModule = {
        id: 'module-1',
        key: 'students',
        name: 'Students',
        description: null,
        displayOrder: 1,
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        userRoles: [
          {
            role: {
              id: 'role-1',
              name: 'TEACHER',
            },
          },
        ],
        userStudents: [],
        student: null,
      });

      mockPrisma.module.findUnique.mockResolvedValue(mockModule);
      mockPrisma.schoolModule.findUnique.mockResolvedValue({ isActive: true });
      mockPrisma.roleModuleSchool.findMany.mockResolvedValue([
        { roleId: 'role-1', moduleId: 'module-1' },
      ]);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for own scope permission when PARENT is linked to student', async () => {
      // Arrange
      const input = {
        userId: TEST_CONSTANTS.USER_ID,
        permission: 'students.readOwn',
        resourceOwnerId: 'student-1',
      };

      const mockModule = {
        id: 'module-1',
        key: 'students',
        name: 'Students',
        description: null,
        displayOrder: 1,
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        userRoles: [
          {
            role: {
              id: 'role-1',
              name: 'PARENT',
            },
          },
        ],
        userStudents: [{ studentId: 'student-1' }],
        student: null,
      });

      mockPrisma.module.findUnique.mockResolvedValue(mockModule);
      mockPrisma.schoolModule.findUnique.mockResolvedValue({ isActive: true });
      mockPrisma.roleModuleSchool.findMany.mockResolvedValue([
        { roleId: 'role-1', moduleId: 'module-1' },
      ]);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for own scope permission when PARENT is not linked to student', async () => {
      // Arrange
      const input = {
        userId: TEST_CONSTANTS.USER_ID,
        permission: 'students.readOwn',
        resourceOwnerId: 'student-2',
      };

      const mockModule = {
        id: 'module-1',
        key: 'students',
        name: 'Students',
        description: null,
        displayOrder: 1,
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        userRoles: [
          {
            role: {
              id: 'role-1',
              name: 'PARENT',
            },
          },
        ],
        userStudents: [{ studentId: 'student-1' }], // Different student
        student: null,
      });

      mockPrisma.module.findUnique.mockResolvedValue(mockModule);
      mockPrisma.schoolModule.findUnique.mockResolvedValue({ isActive: true });
      mockPrisma.roleModuleSchool.findMany.mockResolvedValue([
        { roleId: 'role-1', moduleId: 'module-1' },
      ]);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for own scope permission when STUDENT views own record', async () => {
      // Arrange
      const input = {
        userId: TEST_CONSTANTS.USER_ID,
        permission: 'students.readOwn',
        resourceOwnerId: 'student-1',
      };

      const mockModule = {
        id: 'module-1',
        key: 'students',
        name: 'Students',
        description: null,
        displayOrder: 1,
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        userRoles: [
          {
            role: {
              id: 'role-1',
              name: 'STUDENT',
            },
          },
        ],
        userStudents: [],
        student: {
          id: 'student-1',
        },
      });

      mockPrisma.module.findUnique.mockResolvedValue(mockModule);
      mockPrisma.schoolModule.findUnique.mockResolvedValue({ isActive: true });
      mockPrisma.roleModuleSchool.findMany.mockResolvedValue([
        { roleId: 'role-1', moduleId: 'module-1' },
      ]);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for own scope permission when STUDENT views different record', async () => {
      // Arrange
      const input = {
        userId: TEST_CONSTANTS.USER_ID,
        permission: 'students.readOwn',
        resourceOwnerId: 'student-2',
      };

      const mockModule = {
        id: 'module-1',
        key: 'students',
        name: 'Students',
        description: null,
        displayOrder: 1,
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        userRoles: [
          {
            role: {
              id: 'role-1',
              name: 'STUDENT',
            },
          },
        ],
        userStudents: [],
        student: {
          id: 'student-1', // Different student
        },
      });

      mockPrisma.module.findUnique.mockResolvedValue(mockModule);
      mockPrisma.schoolModule.findUnique.mockResolvedValue({ isActive: true });
      mockPrisma.roleModuleSchool.findMany.mockResolvedValue([
        { roleId: 'role-1', moduleId: 'module-1' },
      ]);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('enforcePermission', () => {
    it('should not throw when permission is granted', async () => {
      // Arrange
      const input = {
        userId: TEST_CONSTANTS.USER_ID,
        permission: 'students.read',
      };

      const mockModule = {
        id: 'module-1',
        key: 'students',
        name: 'Students',
        description: null,
        displayOrder: 1,
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        userRoles: [
          {
            role: {
              id: 'role-1',
              name: 'TEACHER',
            },
          },
        ],
        userStudents: [],
        student: null,
      });

      mockPrisma.module.findUnique.mockResolvedValue(mockModule);
      mockPrisma.schoolModule.findUnique.mockResolvedValue({ isActive: true });
      mockPrisma.roleModuleSchool.findMany.mockResolvedValue([
        { roleId: 'role-1', moduleId: 'module-1' },
      ]);

      // Act & Assert
      await expect(useCase.enforcePermission(input)).resolves.not.toThrow();
    });

    it('should throw when permission is denied', async () => {
      // Arrange
      const input = {
        userId: TEST_CONSTANTS.USER_ID,
        permission: 'students.read',
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.enforcePermission(input)).rejects.toThrow(
        'No tienes permiso para: students.read'
      );
    });
  });

  describe('getUserPermissions', () => {
    it('should return empty array when user has no roles', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        userRoles: [],
        userStudents: [],
        student: null,
      });

      // Act
      const result = await useCase.getUserPermissions(TEST_CONSTANTS.USER_ID);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return permissions for SUPERADMIN', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        userRoles: [
          {
            role: {
              id: 'role-1',
              name: 'SUPERADMIN',
            },
          },
        ],
        userStudents: [],
        student: null,
      });

      mockPrisma.module.findMany.mockResolvedValue([
        { id: 'module-1', key: 'users', name: 'Users', description: null, displayOrder: 1 },
        { id: 'module-2', key: 'schools', name: 'Schools', description: null, displayOrder: 2 },
      ]);

      mockPrisma.schoolModule.findMany.mockResolvedValue([
        { moduleId: 'module-1' },
        { moduleId: 'module-2' },
      ]);

      // Act
      const result = await useCase.getUserPermissions(TEST_CONSTANTS.USER_ID);

      // Assert
      expect(result.length).toBeGreaterThan(0);
      // SUPERADMIN only has access to users and schools modules, not students
      expect(result).toContain('users.read');
      expect(result).toContain('schools.read');
      expect(result).toContain('users.create');
      expect(result).toContain('schools.create');
    });
  });

  describe('getUserModules', () => {
    it('should return empty array when user has no roles', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        userRoles: [],
        userStudents: [],
        student: null,
      });

      // Act
      const result = await useCase.getUserModules(TEST_CONSTANTS.USER_ID);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return modules with actions for user', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        userRoles: [
          {
            role: {
              id: 'role-1',
              name: 'TEACHER',
            },
          },
        ],
        userStudents: [],
        student: null,
      });

      mockPrisma.module.findMany.mockResolvedValue([
        { id: 'module-1', key: 'students', name: 'Students', description: null, displayOrder: 1 },
      ]);

      mockPrisma.schoolModule.findMany.mockResolvedValue([
        { moduleId: 'module-1' },
      ]);

      mockPrisma.roleModuleSchool.findMany.mockResolvedValue([
        { roleId: 'role-1', moduleId: 'module-1' },
      ]);

      // Act
      const result = await useCase.getUserModules(TEST_CONSTANTS.USER_ID);

      // Assert
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('key');
      expect(result[0]).toHaveProperty('actions');
      expect(Array.isArray(result[0].actions)).toBe(true);
    });
  });
});

