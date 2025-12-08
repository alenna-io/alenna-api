import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CreateCertificationTypeUseCase } from '../../../core/app/use-cases/certification-types/CreateCertificationTypeUseCase';
import { CertificationType } from '../../../core/domain/entities';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

// Mock Prisma Client
const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      certificationType: {
        create: vi.fn(),
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

describe('CreateCertificationTypeUseCase', () => {
  let useCase: CreateCertificationTypeUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    useCase = new CreateCertificationTypeUseCase();
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should create certification type with all fields', async () => {
      // Arrange
      const input = {
        name: 'High School Diploma',
        description: 'Standard high school diploma',
        isActive: true,
      };

      const createdCertType = {
        id: 'cert-1',
        name: 'High School Diploma',
        description: 'Standard high school diploma',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.certificationType.create.mockResolvedValue(createdCertType);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, input);

      // Assert
      expect(result).toBeInstanceOf(CertificationType);
      expect(result.name).toBe('High School Diploma');
      expect(result.description).toBe('Standard high school diploma');
      expect(result.schoolId).toBe(TEST_CONSTANTS.SCHOOL_ID);
      expect(result.isActive).toBe(true);
      expect(mockPrisma.certificationType.create).toHaveBeenCalledWith({
        data: {
          name: 'High School Diploma',
          description: 'Standard high school diploma',
          isActive: true,
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
        },
      });
    });

    it('should create certification type with default isActive when not provided', async () => {
      // Arrange
      const input = {
        name: 'GED',
        description: 'General Education Development',
      };

      const createdCertType = {
        id: 'cert-2',
        name: 'GED',
        description: 'General Education Development',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.certificationType.create.mockResolvedValue(createdCertType);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, input);

      // Assert
      expect(result.isActive).toBe(true);
      expect(mockPrisma.certificationType.create).toHaveBeenCalledWith({
        data: {
          name: 'GED',
          description: 'General Education Development',
          isActive: true,
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
        },
      });
    });

    it('should create certification type without description', async () => {
      // Arrange
      const input = {
        name: 'Certificate',
      };

      const createdCertType = {
        id: 'cert-3',
        name: 'Certificate',
        description: null,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.certificationType.create.mockResolvedValue(createdCertType);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, input);

      // Assert
      expect(result.description).toBeUndefined();
      expect(mockPrisma.certificationType.create).toHaveBeenCalledWith({
        data: {
          name: 'Certificate',
          description: undefined,
          isActive: true,
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
        },
      });
    });

    it('should create inactive certification type when isActive is false', async () => {
      // Arrange
      const input = {
        name: 'Inactive Cert',
        description: 'Inactive certification',
        isActive: false,
      };

      const createdCertType = {
        id: 'cert-4',
        name: 'Inactive Cert',
        description: 'Inactive certification',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.certificationType.create.mockResolvedValue(createdCertType);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, input);

      // Assert
      expect(result.isActive).toBe(false);
      expect(mockPrisma.certificationType.create).toHaveBeenCalledWith({
        data: {
          name: 'Inactive Cert',
          description: 'Inactive certification',
          isActive: false,
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
        },
      });
    });
  });
});

