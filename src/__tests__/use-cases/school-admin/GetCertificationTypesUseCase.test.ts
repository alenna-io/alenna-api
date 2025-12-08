import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GetCertificationTypesUseCase } from '../../../core/app/use-cases/certification-types/GetCertificationTypesUseCase';
import { CertificationType } from '../../../core/domain/entities';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

// Mock Prisma Client
const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      certificationType: {
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

vi.mock('../../../core/frameworks/database/prisma.client', () => {
  return {
    default: mockPrismaInstance,
  };
});

describe('GetCertificationTypesUseCase', () => {
  let useCase: GetCertificationTypesUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    useCase = new GetCertificationTypesUseCase();
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return all active certification types for school', async () => {
      // Arrange
      const mockCertTypes = [
        {
          id: 'cert-1',
          name: 'High School Diploma',
          description: 'Standard high school diploma',
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          isActive: true,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'cert-2',
          name: 'GED',
          description: 'General Education Development',
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          isActive: true,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.certificationType.findMany.mockResolvedValue(mockCertTypes);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(CertificationType);
      expect(result[0].name).toBe('High School Diploma');
      expect(result[1].name).toBe('GED');
      expect(mockPrisma.certificationType.findMany).toHaveBeenCalledWith({
        where: {
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          isActive: true,
          deletedAt: null,
        },
        orderBy: {
          name: 'asc',
        },
      });
    });

    it('should return empty array when no certification types found', async () => {
      // Arrange
      mockPrisma.certificationType.findMany.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result).toEqual([]);
    });

    it('should map certification type properties correctly', async () => {
      // Arrange
      const mockCertType = {
        id: 'cert-1',
        name: 'High School Diploma',
        description: 'Standard high school diploma',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
        deletedAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockPrisma.certificationType.findMany.mockResolvedValue([mockCertType]);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result[0].id).toBe('cert-1');
      expect(result[0].name).toBe('High School Diploma');
      expect(result[0].description).toBe('Standard high school diploma');
      expect(result[0].schoolId).toBe(TEST_CONSTANTS.SCHOOL_ID);
      expect(result[0].isActive).toBe(true);
    });

    it('should handle certification types without description', async () => {
      // Arrange
      const mockCertType = {
        id: 'cert-1',
        name: 'High School Diploma',
        description: null,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.certificationType.findMany.mockResolvedValue([mockCertType]);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result[0].description).toBeUndefined();
    });
  });
});

