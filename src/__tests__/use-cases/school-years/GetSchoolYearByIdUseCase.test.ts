import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetSchoolYearByIdUseCase } from '../../../core/app/use-cases/school-years/GetSchoolYearByIdUseCase';
import { createMockSchoolYearRepository } from '../../utils/mockRepositories';
import { NotFoundError } from '../../../utils/errors';

describe('GetSchoolYearByIdUseCase', () => {
  let useCase: GetSchoolYearByIdUseCase;
  let mockRepository: ReturnType<typeof createMockSchoolYearRepository>;

  beforeEach(() => {
    mockRepository = createMockSchoolYearRepository();
    useCase = new GetSchoolYearByIdUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return school year when found', async () => {
      // Arrange
      const schoolYear = {
        id: 'school-year-1',
        schoolId: 'school-1',
        name: '2024-2025',
        startDate: new Date('2024-09-01T00:00:00.000Z'),
        endDate: new Date('2025-06-30T00:00:00.000Z'),
        isActive: true,
        quarters: [
          {
            id: 'quarter-1',
            schoolYearId: 'school-year-1',
            name: 'Q1',
            displayName: 'First Quarter',
            startDate: new Date('2024-09-01T00:00:00.000Z'),
            endDate: new Date('2024-11-15T00:00:00.000Z'),
            order: 1,
            weeksCount: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(schoolYear);

      // Act
      const result = await useCase.execute('school-year-1');

      // Assert
      expect(result.id).toBe('school-year-1');
      expect(result.name).toBe('2024-2025');
      expect(result.isActive).toBe(true);
      expect(result.quarters).toHaveLength(1);
      expect(mockRepository.findById).toHaveBeenCalledWith('school-year-1');
    });

    it('should throw NotFoundError when school year not found', async () => {
      // Arrange
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute('non-existent-id')).rejects.toThrow(NotFoundError);
      await expect(useCase.execute('non-existent-id')).rejects.toThrow('Año escolar no encontrado');
      expect(mockRepository.findById).toHaveBeenCalledWith('non-existent-id');
    });

    it('should convert all dates to ISO strings', async () => {
      // Arrange
      const schoolYear = {
        id: 'school-year-1',
        schoolId: 'school-1',
        name: '2024-2025',
        startDate: new Date('2024-09-01T08:00:00.000Z'),
        endDate: new Date('2025-06-30T18:30:00.000Z'),
        isActive: true,
        quarters: [
          {
            id: 'quarter-1',
            schoolYearId: 'school-year-1',
            name: 'Q1',
            displayName: 'First Quarter',
            startDate: new Date('2024-09-01T00:00:00.000Z'),
            endDate: new Date('2024-11-15T23:59:59.999Z'),
            order: 1,
            weeksCount: 10,
            createdAt: new Date('2024-01-01T10:00:00.000Z'),
            updatedAt: new Date('2024-01-02T15:30:00.000Z'),
          },
        ],
        createdAt: new Date('2024-01-01T12:00:00.000Z'),
        updatedAt: new Date('2024-01-02T16:45:00.000Z'),
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(schoolYear);

      // Act
      const result = await useCase.execute('school-year-1');

      // Assert
      expect(result.startDate).toBe('2024-09-01T08:00:00.000Z');
      expect(result.endDate).toBe('2025-06-30T18:30:00.000Z');
      expect(result.quarters[0].startDate).toBe('2024-09-01T00:00:00.000Z');
      expect(result.quarters[0].endDate).toBe('2024-11-15T23:59:59.999Z');
      expect(result.quarters[0].createdAt).toBe('2024-01-01T10:00:00.000Z');
      expect(result.quarters[0].updatedAt).toBe('2024-01-02T15:30:00.000Z');
      expect(result.createdAt).toBe('2024-01-01T12:00:00.000Z');
      expect(result.updatedAt).toBe('2024-01-02T16:45:00.000Z');
    });

    it('should map school year with quarters correctly', async () => {
      // Arrange
      const schoolYear = {
        id: 'school-year-1',
        schoolId: 'school-1',
        name: '2024-2025',
        startDate: new Date('2024-09-01T00:00:00.000Z'),
        endDate: new Date('2025-06-30T00:00:00.000Z'),
        isActive: true,
        quarters: [
          {
            id: 'quarter-1',
            schoolYearId: 'school-year-1',
            name: 'Q1',
            displayName: 'First Quarter',
            startDate: new Date('2024-09-01T00:00:00.000Z'),
            endDate: new Date('2024-11-15T00:00:00.000Z'),
            order: 1,
            weeksCount: 10,
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            updatedAt: new Date('2024-01-02T00:00:00.000Z'),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(schoolYear);

      // Act
      const result = await useCase.execute('school-year-1');

      // Assert
      expect(result.quarters[0].id).toBe('quarter-1');
      expect(result.quarters[0].name).toBe('Q1');
      expect(result.quarters[0].displayName).toBe('First Quarter');
      expect(result.quarters[0].order).toBe(1);
      expect(result.quarters[0].weeksCount).toBe(10);
    });
  });
});

