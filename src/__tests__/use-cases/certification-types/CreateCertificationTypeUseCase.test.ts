import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CreateCertificationTypeUseCase } from '../../../core/app/use-cases/certification-types/CreateCertificationTypeUseCase';
import { CertificationType } from '../../../core/domain/entities/deprecated';
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
        name: 'INEA',
        description: 'Instituto Nacional para la Educación de los Adultos',
        isActive: true,
      };

      const createdCertType = {
        id: 'cert-1',
        name: 'INEA',
        description: 'Instituto Nacional para la Educación de los Adultos',
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
      expect(result.name).toBe('INEA');
      expect(result.description).toBe('Instituto Nacional para la Educación de los Adultos');
      expect(result.schoolId).toBe(TEST_CONSTANTS.SCHOOL_ID);
      expect(result.isActive).toBe(true);
      expect(mockPrisma.certificationType.create).toHaveBeenCalledWith({
        data: {
          name: 'INEA',
          description: 'Instituto Nacional para la Educación de los Adultos',
          isActive: true,
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
        },
      });
    });

    it('should create certification type with default isActive when not provided', async () => {
      // Arrange
      const input = {
        name: 'Grace Christian',
        description: 'Grace Christian School Program',
        isActive: true,
      };

      const createdCertType = {
        id: 'cert-2',
        name: 'Grace Christian',
        description: 'Grace Christian School Program',
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
          name: 'Grace Christian',
          description: 'Grace Christian School Program',
          isActive: true,
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
        },
      });
    });

    it('should create certification type without description', async () => {
      // Arrange
      const input = {
        name: 'Otro',
        isActive: true,
      };

      const createdCertType = {
        id: 'cert-3',
        name: 'Otro',
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
          name: 'Otro',
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
        description: 'Inactive certification type',
        isActive: false,
      };

      const createdCertType = {
        id: 'cert-4',
        name: 'Inactive Cert',
        description: 'Inactive certification type',
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
          description: 'Inactive certification type',
          isActive: false,
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
        },
      });
    });

    it('should associate certification type with correct school', async () => {
      // Arrange
      const input = {
        name: 'Lighthouse',
        description: 'Lighthouse Christian Academy',
        isActive: true,
      };

      const createdCertType = {
        id: 'cert-5',
        name: 'Lighthouse',
        description: 'Lighthouse Christian Academy',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.certificationType.create.mockResolvedValue(createdCertType);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, input);

      // Assert
      expect(result.schoolId).toBe(TEST_CONSTANTS.SCHOOL_ID);
      expect(mockPrisma.certificationType.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
        }),
      });
    });

    it('should map created certification type to domain entity correctly', async () => {
      // Arrange
      const input = {
        name: 'Home Life',
        description: 'Home Life Academy Program',
        isActive: true,
      };

      const createdCertType = {
        id: 'cert-6',
        name: 'Home Life',
        description: 'Home Life Academy Program',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      };

      mockPrisma.certificationType.create.mockResolvedValue(createdCertType);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, input);

      // Assert
      expect(result).toBeInstanceOf(CertificationType);
      expect(result.id).toBe('cert-6');
      expect(result.name).toBe('Home Life');
      expect(result.description).toBe('Home Life Academy Program');
      expect(result.schoolId).toBe(TEST_CONSTANTS.SCHOOL_ID);
      expect(result.isActive).toBe(true);
      expect(result.createdAt).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(result.updatedAt).toEqual(new Date('2024-01-02T00:00:00.000Z'));
    });
  });
});

