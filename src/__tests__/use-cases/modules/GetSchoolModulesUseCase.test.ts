import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetSchoolModulesUseCase } from '../../../core/app/use-cases/deprecated/modules/GetSchoolModulesUseCase';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

// Mock Prisma Client
const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      module: {
        findMany: vi.fn(),
      },
      schoolModule: {
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

describe('GetSchoolModulesUseCase', () => {
  let useCase: GetSchoolModulesUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    useCase = new GetSchoolModulesUseCase();
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return all modules with enabled status for school', async () => {
      // Arrange
      const allModules = [
        {
          id: 'module-1',
          key: 'students',
          name: 'Students',
          description: 'Student management',
          displayOrder: 1,
          isActive: true,
        },
        {
          id: 'module-2',
          key: 'projections',
          name: 'Projections',
          description: 'Academic projections',
          displayOrder: 2,
          isActive: true,
        },
        {
          id: 'module-3',
          key: 'paces',
          name: 'PACEs',
          description: 'PACE management',
          displayOrder: 3,
          isActive: true,
        },
      ];

      const enabledModules = [
        {
          moduleId: 'module-1',
          module: allModules[0],
        },
        {
          moduleId: 'module-2',
          module: allModules[1],
        },
      ];

      mockPrisma.module.findMany.mockResolvedValue(allModules);
      mockPrisma.schoolModule.findMany.mockResolvedValue(enabledModules);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].isEnabled).toBe(true); // students
      expect(result[1].isEnabled).toBe(true); // projections
      expect(result[2].isEnabled).toBe(false); // paces
      expect(mockPrisma.module.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
        },
        orderBy: {
          displayOrder: 'asc',
        },
      });
      expect(mockPrisma.schoolModule.findMany).toHaveBeenCalledWith({
        where: {
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          isActive: true,
        },
        include: {
          module: true,
        },
      });
    });

    it('should return all modules as disabled when school has no enabled modules', async () => {
      // Arrange
      const allModules = [
        {
          id: 'module-1',
          key: 'students',
          name: 'Students',
          description: 'Student management',
          displayOrder: 1,
          isActive: true,
        },
      ];

      mockPrisma.module.findMany.mockResolvedValue(allModules);
      mockPrisma.schoolModule.findMany.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].isEnabled).toBe(false);
    });

    it('should preserve module order from displayOrder', async () => {
      // Arrange
      // Prisma would return modules sorted by displayOrder, so mock should return sorted data
      const allModules = [
        {
          id: 'module-1',
          key: 'students',
          name: 'Students',
          description: 'Student management',
          displayOrder: 1,
          isActive: true,
        },
        {
          id: 'module-2',
          key: 'projections',
          name: 'Projections',
          description: 'Academic projections',
          displayOrder: 2,
          isActive: true,
        },
        {
          id: 'module-3',
          key: 'paces',
          name: 'PACEs',
          description: 'PACE management',
          displayOrder: 3,
          isActive: true,
        },
      ];

      mockPrisma.module.findMany.mockResolvedValue(allModules);
      mockPrisma.schoolModule.findMany.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result[0].key).toBe('students'); // displayOrder: 1
      expect(result[1].key).toBe('projections'); // displayOrder: 2
      expect(result[2].key).toBe('paces'); // displayOrder: 3
    });

    it('should map module properties correctly', async () => {
      // Arrange
      const allModules = [
        {
          id: 'module-1',
          key: 'students',
          name: 'Students',
          description: 'Student management',
          displayOrder: 1,
          isActive: true,
        },
      ];

      mockPrisma.module.findMany.mockResolvedValue(allModules);
      mockPrisma.schoolModule.findMany.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result[0]).toEqual({
        id: 'module-1',
        key: 'students',
        name: 'Students',
        description: 'Student management',
        displayOrder: 1,
        isEnabled: false,
      });
    });
  });
});

