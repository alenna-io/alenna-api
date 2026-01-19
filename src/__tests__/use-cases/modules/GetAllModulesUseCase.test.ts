import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetAllModulesUseCase } from '../../../core/app/use-cases/deprecated/modules/GetAllModulesUseCase';

// Mock Prisma Client
const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      module: {
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

describe('GetAllModulesUseCase', () => {
  let useCase: GetAllModulesUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    useCase = new GetAllModulesUseCase();
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return all active modules ordered by displayOrder', async () => {
      // Arrange
      const mockModules = [
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

      mockPrisma.module.findMany.mockResolvedValue(mockModules);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].key).toBe('students');
      expect(result[1].key).toBe('projections');
      expect(result[2].key).toBe('paces');
      expect(mockPrisma.module.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
        },
        orderBy: {
          displayOrder: 'asc',
        },
      });
    });

    it('should return empty array when no active modules exist', async () => {
      // Arrange
      mockPrisma.module.findMany.mockResolvedValue([]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual([]);
    });

    it('should map module properties correctly', async () => {
      // Arrange
      const mockModule = {
        id: 'module-1',
        key: 'students',
        name: 'Students',
        description: 'Student management',
        displayOrder: 1,
        isActive: true,
      };

      mockPrisma.module.findMany.mockResolvedValue([mockModule]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result[0]).toEqual({
        id: 'module-1',
        key: 'students',
        name: 'Students',
        description: 'Student management',
        displayOrder: 1,
        isActive: true,
      });
    });

    it('should handle null description', async () => {
      // Arrange
      const mockModule = {
        id: 'module-1',
        key: 'students',
        name: 'Students',
        description: null,
        displayOrder: 1,
        isActive: true,
      };

      mockPrisma.module.findMany.mockResolvedValue([mockModule]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result[0].description).toBeNull();
    });
  });
});

