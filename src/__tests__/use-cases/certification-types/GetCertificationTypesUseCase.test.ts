import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GetCertificationTypesUseCase } from '../../../core/app/use-cases/certification-types/GetCertificationTypesUseCase';
import { CertificationType } from '../../../core/domain/entities/deprecated';
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
          name: 'INEA',
          description: 'Instituto Nacional para la Educación de los Adultos',
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          isActive: true,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'cert-2',
          name: 'Grace Christian',
          description: 'Grace Christian School Program',
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
      expect(result[0].name).toBe('INEA');
      expect(result[1].name).toBe('Grace Christian');
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
        name: 'Home Life',
        description: 'Home Life Academy Program',
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
      expect(result[0].name).toBe('Home Life');
      expect(result[0].description).toBe('Home Life Academy Program');
      expect(result[0].schoolId).toBe(TEST_CONSTANTS.SCHOOL_ID);
      expect(result[0].isActive).toBe(true);
    });

    it('should handle certification types without description', async () => {
      // Arrange
      const mockCertType = {
        id: 'cert-1',
        name: 'Otro',
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

    it('should filter by school and active status only', async () => {
      // Arrange
      const mockCertTypes = [
        {
          id: 'cert-1',
          name: 'Active Type',
          description: 'Active certification',
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          isActive: true,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.certificationType.findMany.mockResolvedValue(mockCertTypes);

      // Act
      await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
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

    it('should return certification types sorted by name ascending', async () => {
      // Arrange
      // Mock data should be pre-sorted to match Prisma's orderBy behavior
      const mockCertTypes = [
        {
          id: 'cert-1',
          name: 'Grace Christian',
          description: 'Grace Christian School Program',
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          isActive: true,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'cert-2',
          name: 'Home Life',
          description: 'Home Life Academy Program',
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          isActive: true,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'cert-3',
          name: 'Lighthouse',
          description: 'Lighthouse Christian Academy',
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
      expect(result[0].name).toBe('Grace Christian');
      expect(result[1].name).toBe('Home Life');
      expect(result[2].name).toBe('Lighthouse');
      // Verify that orderBy is called correctly
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
  });
});

