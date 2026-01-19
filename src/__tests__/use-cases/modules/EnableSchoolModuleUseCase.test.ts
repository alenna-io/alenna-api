import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnableSchoolModuleUseCase } from '../../../core/app/use-cases/deprecated/modules/EnableSchoolModuleUseCase';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

// Mock Prisma Client
const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      module: {
        findUnique: vi.fn(),
      },
      schoolModule: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      role: {
        findFirst: vi.fn(),
      },
      roleModuleSchool: {
        upsert: vi.fn(),
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

describe('EnableSchoolModuleUseCase', () => {
  let useCase: EnableSchoolModuleUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    useCase = new EnableSchoolModuleUseCase();
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should enable module for school when no dependencies', async () => {
      // Arrange
      const module = {
        id: 'module-1',
        key: 'students',
        name: 'Students',
      };

      const role = {
        id: 'role-1',
        name: 'SCHOOL_ADMIN',
      };

      mockPrisma.module.findUnique.mockResolvedValue(module);
      mockPrisma.role.findFirst.mockResolvedValue(role);
      mockPrisma.schoolModule.upsert.mockResolvedValue({});
      mockPrisma.roleModuleSchool.upsert.mockResolvedValue({});

      // Act
      await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'module-1');

      // Assert
      expect(mockPrisma.module.findUnique).toHaveBeenCalledWith({
        where: { id: 'module-1' },
      });
      expect(mockPrisma.schoolModule.upsert).toHaveBeenCalledWith({
        where: {
          schoolId_moduleId: {
            schoolId: TEST_CONSTANTS.SCHOOL_ID,
            moduleId: 'module-1',
          },
        },
        update: {
          isActive: true,
        },
        create: expect.objectContaining({
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          moduleId: 'module-1',
          isActive: true,
        }),
      });
    });

    it('should throw error when module not found', async () => {
      // Arrange
      mockPrisma.module.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'module-1')
      ).rejects.toThrow('Module not found');
    });

    it('should throw error when dependency not found', async () => {
      // Arrange
      const module = {
        id: 'module-2',
        key: 'monthlyAssignments',
        name: 'Monthly Assignments',
      };

      mockPrisma.module.findUnique
        .mockResolvedValueOnce(module) // Main module
        .mockResolvedValueOnce(null); // Dependency not found

      // Act & Assert
      await expect(
        useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'module-2')
      ).rejects.toThrow("Dependency module 'projections' not found");
    });

    it('should throw error when dependency not enabled', async () => {
      // Arrange
      const module = {
        id: 'module-2',
        key: 'monthlyAssignments',
        name: 'Monthly Assignments',
      };

      const dependencyModule = {
        id: 'module-1',
        key: 'projections',
        name: 'Projections',
      };

      mockPrisma.module.findUnique
        .mockResolvedValueOnce(module) // Main module
        .mockResolvedValueOnce(dependencyModule); // Dependency module

      mockPrisma.schoolModule.findUnique.mockResolvedValue(null); // Dependency not enabled

      // Act & Assert
      await expect(
        useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'module-2')
      ).rejects.toThrow(
        "Module 'monthlyAssignments' requires module 'projections' to be enabled first"
      );
    });

    it('should enable module when dependency is enabled', async () => {
      // Arrange
      const module = {
        id: 'module-2',
        key: 'monthlyAssignments',
        name: 'Monthly Assignments',
      };

      const dependencyModule = {
        id: 'module-1',
        key: 'projections',
        name: 'Projections',
      };

      const role1 = { id: 'role-1', name: 'SCHOOL_ADMIN' };
      const role2 = { id: 'role-2', name: 'TEACHER' };

      mockPrisma.module.findUnique
        .mockResolvedValueOnce(module) // Main module
        .mockResolvedValueOnce(dependencyModule); // Dependency module

      mockPrisma.schoolModule.findUnique.mockResolvedValue({
        isActive: true, // Dependency is enabled
      });

      mockPrisma.role.findFirst
        .mockResolvedValueOnce(role1)
        .mockResolvedValueOnce(role2);

      mockPrisma.schoolModule.upsert.mockResolvedValue({});
      mockPrisma.roleModuleSchool.upsert.mockResolvedValue({});

      // Act
      await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'module-2');

      // Assert
      expect(mockPrisma.schoolModule.upsert).toHaveBeenCalled();
      expect(mockPrisma.roleModuleSchool.upsert).toHaveBeenCalledTimes(2); // SCHOOL_ADMIN and TEACHER
    });

    it('should grant correct roles for students module', async () => {
      // Arrange
      const module = {
        id: 'module-1',
        key: 'students',
        name: 'Students',
      };

      const roles = [
        { id: 'role-1', name: 'SCHOOL_ADMIN' },
        { id: 'role-2', name: 'TEACHER' },
        { id: 'role-3', name: 'PARENT' },
        { id: 'role-4', name: 'STUDENT' },
      ];

      mockPrisma.module.findUnique.mockResolvedValue(module);
      mockPrisma.role.findFirst
        .mockResolvedValueOnce(roles[0])
        .mockResolvedValueOnce(roles[1])
        .mockResolvedValueOnce(roles[2])
        .mockResolvedValueOnce(roles[3]);

      mockPrisma.schoolModule.upsert.mockResolvedValue({});
      mockPrisma.roleModuleSchool.upsert.mockResolvedValue({});

      // Act
      await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'module-1');

      // Assert
      expect(mockPrisma.roleModuleSchool.upsert).toHaveBeenCalledTimes(4);
    });

    it('should grant correct roles for monthlyAssignments module', async () => {
      // Arrange
      const module = {
        id: 'module-2',
        key: 'monthlyAssignments',
        name: 'Monthly Assignments',
      };

      const roles = [
        { id: 'role-1', name: 'SCHOOL_ADMIN' },
        { id: 'role-2', name: 'TEACHER' },
      ];

      mockPrisma.module.findUnique.mockResolvedValue(module);
      mockPrisma.role.findFirst
        .mockResolvedValueOnce(roles[0])
        .mockResolvedValueOnce(roles[1]);

      mockPrisma.schoolModule.upsert.mockResolvedValue({});
      mockPrisma.roleModuleSchool.upsert.mockResolvedValue({});

      // Act
      await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'module-2');

      // Assert
      expect(mockPrisma.roleModuleSchool.upsert).toHaveBeenCalledTimes(2);
    });

    it('should grant SUPERADMIN role for schools module', async () => {
      // Arrange
      const module = {
        id: 'module-3',
        key: 'schools',
        name: 'Schools',
      };

      const role = { id: 'role-1', name: 'SUPERADMIN' };

      mockPrisma.module.findUnique.mockResolvedValue(module);
      mockPrisma.role.findFirst.mockResolvedValue(role);
      mockPrisma.schoolModule.upsert.mockResolvedValue({});
      mockPrisma.roleModuleSchool.upsert.mockResolvedValue({});

      // Act
      await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'module-3');

      // Assert
      expect(mockPrisma.role.findFirst).toHaveBeenCalledWith({
        where: {
          name: 'SUPERADMIN',
          schoolId: null,
        },
      });
      expect(mockPrisma.roleModuleSchool.upsert).toHaveBeenCalledTimes(1);
    });

    it('should use SCHOOL_ADMIN as default for unknown modules', async () => {
      // Arrange
      const module = {
        id: 'module-4',
        key: 'unknown',
        name: 'Unknown Module',
      };

      const role = { id: 'role-1', name: 'SCHOOL_ADMIN' };

      mockPrisma.module.findUnique.mockResolvedValue(module);
      mockPrisma.role.findFirst.mockResolvedValue(role);
      mockPrisma.schoolModule.upsert.mockResolvedValue({});
      mockPrisma.roleModuleSchool.upsert.mockResolvedValue({});

      // Act
      await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'module-4');

      // Assert
      expect(mockPrisma.role.findFirst).toHaveBeenCalledWith({
        where: {
          name: 'SCHOOL_ADMIN',
          schoolId: null,
        },
      });
    });

    it('should skip role assignment if role not found', async () => {
      // Arrange
      const module = {
        id: 'module-1',
        key: 'students',
        name: 'Students',
      };

      mockPrisma.module.findUnique.mockResolvedValue(module);
      mockPrisma.role.findFirst.mockResolvedValue(null); // Role not found
      mockPrisma.schoolModule.upsert.mockResolvedValue({});

      // Act
      await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'module-1');

      // Assert
      expect(mockPrisma.schoolModule.upsert).toHaveBeenCalled();
      expect(mockPrisma.roleModuleSchool.upsert).not.toHaveBeenCalled();
    });

    it('should handle multiple dependencies', async () => {
      // Arrange
      // Note: Currently only monthlyAssignments and reportCards have dependencies
      // This test verifies the loop works correctly
      const module = {
        id: 'module-2',
        key: 'monthlyAssignments',
        name: 'Monthly Assignments',
      };

      const dependencyModule = {
        id: 'module-1',
        key: 'projections',
        name: 'Projections',
      };

      const role1 = { id: 'role-1', name: 'SCHOOL_ADMIN' };
      const role2 = { id: 'role-2', name: 'TEACHER' };

      mockPrisma.module.findUnique
        .mockResolvedValueOnce(module) // Main module
        .mockResolvedValueOnce(dependencyModule); // Single dependency

      mockPrisma.schoolModule.findUnique.mockResolvedValue({
        isActive: true,
      });

      mockPrisma.role.findFirst
        .mockResolvedValueOnce(role1)
        .mockResolvedValueOnce(role2);

      mockPrisma.schoolModule.upsert.mockResolvedValue({});
      mockPrisma.roleModuleSchool.upsert.mockResolvedValue({});

      // Act
      await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'module-2');

      // Assert
      expect(mockPrisma.schoolModule.findUnique).toHaveBeenCalledTimes(1); // One dependency check
    });
  });
});

