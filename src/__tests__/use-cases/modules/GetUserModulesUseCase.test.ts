import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetUserModulesUseCase } from '../../../core/app/use-cases/modules/GetUserModulesUseCase';
import { CheckPermissionUseCase } from '../../../core/app/use-cases/auth/CheckPermissionUseCase';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

// Mock CheckPermissionUseCase
const { mockCheckPermissionInstance } = vi.hoisted(() => {
  return {
    mockCheckPermissionInstance: {
      getUserModules: vi.fn(),
    },
  };
});

vi.mock('../../../core/app/use-cases/auth/CheckPermissionUseCase', () => {
  return {
    CheckPermissionUseCase: class {
      constructor() {
        return mockCheckPermissionInstance;
      }
    },
  };
});

describe('GetUserModulesUseCase', () => {
  let useCase: GetUserModulesUseCase;
  let mockCheckPermission: any;

  beforeEach(() => {
    useCase = new GetUserModulesUseCase();
    mockCheckPermission = mockCheckPermissionInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return user modules with actions', async () => {
      // Arrange
      const mockModules = [
        {
          id: 'module-1',
          key: 'students',
          name: 'Students',
          description: 'Student management',
          displayOrder: 1,
          actions: ['read', 'create', 'update'],
        },
        {
          id: 'module-2',
          key: 'projections',
          name: 'Projections',
          description: 'Academic projections',
          displayOrder: 2,
          actions: ['read', 'create'],
        },
      ];

      vi.mocked(mockCheckPermission.getUserModules).mockResolvedValue(mockModules);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.USER_ID);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('students');
      expect(result[0].actions).toEqual(['read', 'create', 'update']);
      expect(result[1].key).toBe('projections');
      expect(result[1].actions).toEqual(['read', 'create']);
      expect(mockCheckPermission.getUserModules).toHaveBeenCalledWith(TEST_CONSTANTS.USER_ID);
    });

    it('should return empty array when user has no modules', async () => {
      // Arrange
      vi.mocked(mockCheckPermission.getUserModules).mockResolvedValue([]);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.USER_ID);

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
        actions: ['read'],
      };

      vi.mocked(mockCheckPermission.getUserModules).mockResolvedValue([mockModule]);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.USER_ID);

      // Assert
      expect(result[0]).toEqual({
        id: 'module-1',
        key: 'students',
        name: 'Students',
        description: 'Student management',
        displayOrder: 1,
        actions: ['read'],
      });
    });

    it('should handle undefined description', async () => {
      // Arrange
      const mockModule = {
        id: 'module-1',
        key: 'students',
        name: 'Students',
        description: undefined,
        displayOrder: 1,
        actions: ['read'],
      };

      vi.mocked(mockCheckPermission.getUserModules).mockResolvedValue([mockModule]);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.USER_ID);

      // Assert
      expect(result[0].description).toBeUndefined();
    });
  });
});

