import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DeleteSchoolYearUseCase } from '../../../core/app/use-cases/school-years/DeleteSchoolYearUseCase';
import { createMockSchoolYearRepository } from '../../utils/mockRepositories';

// Mock Prisma Client
const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      projection: {
        count: vi.fn(),
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

describe('DeleteSchoolYearUseCase', () => {
  let useCase: DeleteSchoolYearUseCase;
  let mockRepository: ReturnType<typeof createMockSchoolYearRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    mockRepository = createMockSchoolYearRepository();
    useCase = new DeleteSchoolYearUseCase(mockRepository);
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should delete school year when no projections exist', async () => {
      // Arrange
      const schoolYear = {
        id: 'school-year-1',
        schoolId: 'school-1',
        name: '2024-2025',
        startDate: new Date(),
        endDate: new Date(),
        isActive: false,
        quarters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(schoolYear);
      mockPrisma.projection.count.mockResolvedValue(0);
      vi.mocked(mockRepository.delete).mockResolvedValue(undefined);

      // Act
      await useCase.execute('school-year-1');

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith('school-year-1');
      expect(mockPrisma.projection.count).toHaveBeenCalledWith({
        where: {
          schoolYear: '2024-2025',
          deletedAt: null,
        },
      });
      expect(mockRepository.delete).toHaveBeenCalledWith('school-year-1');
    });

    it('should throw error when school year not found', async () => {
      // Arrange
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute('non-existent-id')).rejects.toThrow('Año escolar no encontrado');
      expect(mockRepository.findById).toHaveBeenCalledWith('non-existent-id');
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error when projections exist', async () => {
      // Arrange
      const schoolYear = {
        id: 'school-year-1',
        schoolId: 'school-1',
        name: '2024-2025',
        startDate: new Date(),
        endDate: new Date(),
        isActive: false,
        quarters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(schoolYear);
      mockPrisma.projection.count.mockResolvedValue(5);

      // Act & Assert
      await expect(useCase.execute('school-year-1')).rejects.toThrow(
        'No se puede eliminar el año escolar "2024-2025" porque tiene 5 proyecciones asociadas. Elimina las proyecciones primero.'
      );
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should use singular form when one projection exists', async () => {
      // Arrange
      const schoolYear = {
        id: 'school-year-1',
        schoolId: 'school-1',
        name: '2024-2025',
        startDate: new Date(),
        endDate: new Date(),
        isActive: false,
        quarters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(schoolYear);
      mockPrisma.projection.count.mockResolvedValue(1);

      // Act & Assert
      await expect(useCase.execute('school-year-1')).rejects.toThrow(
        'No se puede eliminar el año escolar "2024-2025" porque tiene 1 proyección asociada. Elimina las proyecciones primero.'
      );
    });
  });
});

