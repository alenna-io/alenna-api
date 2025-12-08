import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateSchoolUseCase } from '../../../core/app/use-cases/schools/CreateSchoolUseCase';
import { createMockSchoolRepository } from '../../utils/mockRepositories';
import { School } from '../../../core/domain/entities';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

// Mock Prisma Client
const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      module: {
        findUnique: vi.fn(),
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

// Mock EnableSchoolModuleUseCase
const mockEnableModule = vi.fn();
vi.mock('../../../core/app/use-cases/modules/EnableSchoolModuleUseCase', () => {
  return {
    EnableSchoolModuleUseCase: class {
      execute = mockEnableModule;
    },
  };
});

// Mock CreateDefaultTemplatesUseCase
const mockCreateTemplates = vi.fn();
vi.mock('../../../core/app/use-cases/projection-templates/CreateDefaultTemplatesUseCase', () => {
  return {
    CreateDefaultTemplatesUseCase: class {
      execute = mockCreateTemplates;
    },
  };
});

// Mock ProjectionTemplateRepository
vi.mock('../../../core/frameworks/database/repositories/ProjectionTemplateRepository', () => {
  return {
    ProjectionTemplateRepository: class {},
  };
});

describe('CreateSchoolUseCase', () => {
  let useCase: CreateSchoolUseCase;
  let mockRepository: ReturnType<typeof createMockSchoolRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    mockRepository = createMockSchoolRepository();
    useCase = new CreateSchoolUseCase(mockRepository);
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
    mockEnableModule.mockResolvedValue(undefined);
    mockCreateTemplates.mockResolvedValue(undefined);
  });

  describe('execute', () => {
    it('should create school with all fields', async () => {
      // Arrange
      const input = {
        name: 'Test School',
        address: '123 Main St',
        phone: '555-1234',
        email: 'test@school.com',
        teacherLimit: 50,
        userLimit: 200,
      };

      const createdSchool = School.create({
        id: 'school-1',
        name: 'Test School',
        address: '123 Main St',
        phone: '555-1234',
        email: 'test@school.com',
        teacherLimit: 50,
        userLimit: 200,
        isActive: true,
      });

      vi.mocked(mockRepository.create).mockResolvedValue(createdSchool);
      mockPrisma.module.findUnique.mockResolvedValue({ id: 'module-1', key: 'students' });

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.id).toBe('school-1');
      expect(result.name).toBe('Test School');
      expect(result.address).toBe('123 Main St');
      expect(result.phone).toBe('555-1234');
      expect(result.email).toBe('test@school.com');
      expect(result.teacherLimit).toBe(50);
      expect(result.userLimit).toBe(200);
      expect(result.isActive).toBe(true);
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should create school with minimal fields', async () => {
      // Arrange
      const input = {
        name: 'Test School',
      };

      const createdSchool = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: true,
      });

      vi.mocked(mockRepository.create).mockResolvedValue(createdSchool);
      mockPrisma.module.findUnique.mockResolvedValue({ id: 'module-1', key: 'students' });

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.name).toBe('Test School');
      expect(result.address).toBeUndefined();
      expect(result.phone).toBeUndefined();
      expect(result.email).toBeUndefined();
      expect(result.teacherLimit).toBeUndefined();
      expect(result.userLimit).toBeUndefined();
    });

    it('should enable default modules when no moduleIds provided', async () => {
      // Arrange
      const input = {
        name: 'Test School',
      };

      const createdSchool = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: true,
      });

      vi.mocked(mockRepository.create).mockResolvedValue(createdSchool);
      mockPrisma.module.findUnique
        .mockResolvedValueOnce({ id: 'module-1', key: 'students' })
        .mockResolvedValueOnce({ id: 'module-2', key: 'school_admin' })
        .mockResolvedValueOnce({ id: 'module-3', key: 'groups' });

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockEnableModule).toHaveBeenCalledTimes(3);
      expect(mockPrisma.module.findUnique).toHaveBeenCalledWith({ where: { key: 'students' } });
      expect(mockPrisma.module.findUnique).toHaveBeenCalledWith({ where: { key: 'school_admin' } });
      expect(mockPrisma.module.findUnique).toHaveBeenCalledWith({ where: { key: 'groups' } });
    });

    it('should enable selected modules when moduleIds provided', async () => {
      // Arrange
      const input = {
        name: 'Test School',
        moduleIds: ['module-1', 'module-2'],
      };

      const createdSchool = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: true,
      });

      vi.mocked(mockRepository.create).mockResolvedValue(createdSchool);

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockEnableModule).toHaveBeenCalledTimes(2);
      expect(mockEnableModule).toHaveBeenCalledWith('school-1', 'module-1');
      expect(mockEnableModule).toHaveBeenCalledWith('school-1', 'module-2');
      expect(mockPrisma.module.findUnique).not.toHaveBeenCalled();
    });

    it('should create default projection templates', async () => {
      // Arrange
      const input = {
        name: 'Test School',
      };

      const createdSchool = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: true,
      });

      vi.mocked(mockRepository.create).mockResolvedValue(createdSchool);
      mockPrisma.module.findUnique.mockResolvedValue({ id: 'module-1', key: 'students' });

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockCreateTemplates).toHaveBeenCalledWith('school-1');
    });

    it('should continue even if module setup fails', async () => {
      // Arrange
      const input = {
        name: 'Test School',
      };

      const createdSchool = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: true,
      });

      vi.mocked(mockRepository.create).mockResolvedValue(createdSchool);
      mockPrisma.module.findUnique.mockRejectedValue(new Error('Module not found'));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe('Test School');
    });

    it('should continue even if template creation fails', async () => {
      // Arrange
      const input = {
        name: 'Test School',
      };

      const createdSchool = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: true,
      });

      vi.mocked(mockRepository.create).mockResolvedValue(createdSchool);
      mockPrisma.module.findUnique.mockResolvedValue({ id: 'module-1', key: 'students' });
      mockCreateTemplates.mockRejectedValue(new Error('Template creation failed'));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe('Test School');
    });

    it('should handle optional limits', async () => {
      // Arrange
      const input = {
        name: 'Test School',
        teacherLimit: undefined,
        userLimit: undefined,
      };

      const createdSchool = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: true,
      });

      vi.mocked(mockRepository.create).mockResolvedValue(createdSchool);
      mockPrisma.module.findUnique.mockResolvedValue({ id: 'module-1', key: 'students' });

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.teacherLimit).toBeUndefined();
      expect(result.userLimit).toBeUndefined();
    });
  });
});

