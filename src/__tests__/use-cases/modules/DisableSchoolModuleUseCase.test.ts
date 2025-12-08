import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DisableSchoolModuleUseCase } from '../../../core/app/use-cases/modules/DisableSchoolModuleUseCase';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

// Mock Prisma Client
const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      module: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      schoolModule: {
        findUnique: vi.fn(),
        updateMany: vi.fn(),
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

describe('DisableSchoolModuleUseCase', () => {
  let useCase: DisableSchoolModuleUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    useCase = new DisableSchoolModuleUseCase();
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should disable module when no child modules depend on it', async () => {
      // Arrange
      const module = {
        id: 'module-1',
        key: 'students',
        name: 'Students',
      };

      const allModules = [
        {
          id: 'module-1',
          key: 'students',
          name: 'Students',
        },
        {
          id: 'module-2',
          key: 'projections',
          name: 'Projections',
        },
      ];

      mockPrisma.module.findUnique.mockResolvedValue(module);
      mockPrisma.module.findMany.mockResolvedValue(allModules);
      mockPrisma.schoolModule.findUnique.mockResolvedValue(null); // No child modules enabled
      mockPrisma.schoolModule.updateMany.mockResolvedValue({ count: 1 });

      // Act
      await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'module-1');

      // Assert
      expect(mockPrisma.schoolModule.updateMany).toHaveBeenCalledWith({
        where: {
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          moduleId: 'module-1',
        },
        data: {
          isActive: false,
        },
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

    it('should throw error when child module depends on it and is enabled', async () => {
      // Arrange
      const module = {
        id: 'module-1',
        key: 'projections',
        name: 'Projections',
      };

      const allModules = [
        {
          id: 'module-1',
          key: 'projections',
          name: 'Projections',
        },
        {
          id: 'module-2',
          key: 'monthlyAssignments',
          name: 'Monthly Assignments',
        },
      ];

      mockPrisma.module.findUnique.mockResolvedValue(module);
      mockPrisma.module.findMany.mockResolvedValue(allModules);
      mockPrisma.schoolModule.findUnique.mockResolvedValue({
        isActive: true, // Child module is enabled
      });

      // Act & Assert
      await expect(
        useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'module-1')
      ).rejects.toThrow(
        "Cannot disable module 'projections' because child module 'monthlyAssignments' is still enabled. Please disable 'monthlyAssignments' first."
      );
    });

    it('should allow disabling when child module depends on it but is disabled', async () => {
      // Arrange
      const module = {
        id: 'module-1',
        key: 'projections',
        name: 'Projections',
      };

      const allModules = [
        {
          id: 'module-1',
          key: 'projections',
          name: 'Projections',
        },
        {
          id: 'module-2',
          key: 'monthlyAssignments',
          name: 'Monthly Assignments',
        },
      ];

      mockPrisma.module.findUnique.mockResolvedValue(module);
      mockPrisma.module.findMany.mockResolvedValue(allModules);
      mockPrisma.schoolModule.findUnique.mockResolvedValue({
        isActive: false, // Child module is disabled
      });
      mockPrisma.schoolModule.updateMany.mockResolvedValue({ count: 1 });

      // Act
      await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'module-1');

      // Assert
      expect(mockPrisma.schoolModule.updateMany).toHaveBeenCalled();
    });

    it('should allow disabling when child module depends on it but does not exist', async () => {
      // Arrange
      const module = {
        id: 'module-1',
        key: 'projections',
        name: 'Projections',
      };

      const allModules = [
        {
          id: 'module-1',
          key: 'projections',
          name: 'Projections',
        },
        {
          id: 'module-2',
          key: 'monthlyAssignments',
          name: 'Monthly Assignments',
        },
      ];

      mockPrisma.module.findUnique.mockResolvedValue(module);
      mockPrisma.module.findMany.mockResolvedValue(allModules);
      mockPrisma.schoolModule.findUnique.mockResolvedValue(null); // Child module not enabled
      mockPrisma.schoolModule.updateMany.mockResolvedValue({ count: 1 });

      // Act
      await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'module-1');

      // Assert
      expect(mockPrisma.schoolModule.updateMany).toHaveBeenCalled();
    });

    it('should check all child modules for dependencies', async () => {
      // Arrange
      const module = {
        id: 'module-1',
        key: 'projections',
        name: 'Projections',
      };

      const allModules = [
        {
          id: 'module-1',
          key: 'projections',
          name: 'Projections',
        },
        {
          id: 'module-2',
          key: 'monthlyAssignments',
          name: 'Monthly Assignments',
        },
        {
          id: 'module-3',
          key: 'reportCards',
          name: 'Report Cards',
        },
        {
          id: 'module-4',
          key: 'students',
          name: 'Students',
        },
      ];

      mockPrisma.module.findUnique.mockResolvedValue(module);
      mockPrisma.module.findMany.mockResolvedValue(allModules);
      // First child (monthlyAssignments) is disabled, second (reportCards) is enabled
      mockPrisma.schoolModule.findUnique
        .mockResolvedValueOnce({ isActive: false }) // monthlyAssignments disabled
        .mockResolvedValueOnce({ isActive: true }); // reportCards enabled

      // Act & Assert
      await expect(
        useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'module-1')
      ).rejects.toThrow(
        "Cannot disable module 'projections' because child module 'reportCards' is still enabled"
      );
    });

    it('should handle modules with no dependencies correctly', async () => {
      // Arrange
      const module = {
        id: 'module-1',
        key: 'students',
        name: 'Students',
      };

      const allModules = [
        {
          id: 'module-1',
          key: 'students',
          name: 'Students',
        },
        {
          id: 'module-2',
          key: 'projections',
          name: 'Projections',
        },
      ];

      mockPrisma.module.findUnique.mockResolvedValue(module);
      mockPrisma.module.findMany.mockResolvedValue(allModules);
      // No child modules depend on students, so findUnique should not be called for child checks
      // But the loop will still run and check all modules
      mockPrisma.schoolModule.findUnique.mockResolvedValue(null);
      mockPrisma.schoolModule.updateMany.mockResolvedValue({ count: 1 });

      // Act
      await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'module-1');

      // Assert
      expect(mockPrisma.schoolModule.updateMany).toHaveBeenCalled();
    });

    it('should set isActive to false when disabling', async () => {
      // Arrange
      const module = {
        id: 'module-1',
        key: 'students',
        name: 'Students',
      };

      const allModules = [module];

      mockPrisma.module.findUnique.mockResolvedValue(module);
      mockPrisma.module.findMany.mockResolvedValue(allModules);
      mockPrisma.schoolModule.findUnique.mockResolvedValue(null);
      mockPrisma.schoolModule.updateMany.mockResolvedValue({ count: 1 });

      // Act
      await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'module-1');

      // Assert
      expect(mockPrisma.schoolModule.updateMany).toHaveBeenCalledWith({
        where: {
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          moduleId: 'module-1',
        },
        data: {
          isActive: false,
        },
      });
    });
  });
});

