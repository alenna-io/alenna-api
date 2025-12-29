import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetSchoolYearsUseCase } from '../../../core/app/use-cases/school-years/GetSchoolYearsUseCase';
import { createMockSchoolYearRepository } from '../../utils/mockRepositories';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

describe('GetSchoolYearsUseCase', () => {
  let useCase: GetSchoolYearsUseCase;
  let mockRepository: ReturnType<typeof createMockSchoolYearRepository>;

  beforeEach(() => {
    mockRepository = createMockSchoolYearRepository();
    useCase = new GetSchoolYearsUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return all school years for school', async () => {
      // Arrange
      const schoolYears = [
        {
          id: 'school-year-1',
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          name: '2023-2024',
          startDate: new Date('2023-09-01T00:00:00.000Z'),
          endDate: new Date('2024-06-30T00:00:00.000Z'),
          isActive: false,
          quarters: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'school-year-2',
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          name: '2024-2025',
          startDate: new Date('2024-09-01T00:00:00.000Z'),
          endDate: new Date('2025-06-30T00:00:00.000Z'),
          isActive: true,
          quarters: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(mockRepository.findBySchoolId).mockResolvedValue(schoolYears);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('school-year-1');
      expect(result[1].id).toBe('school-year-2');
      expect(result[1].isActive).toBe(true);
      expect(mockRepository.findBySchoolId).toHaveBeenCalledWith(TEST_CONSTANTS.SCHOOL_ID);
    });

    it('should return empty array when no school years found', async () => {
      // Arrange
      vi.mocked(mockRepository.findBySchoolId).mockResolvedValue([]);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result).toEqual([]);
    });

    it('should convert dates to ISO strings correctly', async () => {
      // Arrange
      const schoolYear = {
        id: 'school-year-1',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: '2024-2025',
        startDate: new Date('2024-09-01T08:30:15.123Z'),
        endDate: new Date('2025-06-30T17:45:30.456Z'),
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
            isClosed: false,
            closedAt: undefined,
            closedBy: undefined,
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            updatedAt: new Date('2024-01-02T00:00:00.000Z'),
          },
        ],
        createdAt: new Date('2024-01-01T12:00:00.000Z'),
        updatedAt: new Date('2024-01-02T14:30:00.000Z'),
      };

      vi.mocked(mockRepository.findBySchoolId).mockResolvedValue([schoolYear]);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result[0].startDate).toBe('2024-09-01T08:30:15.123Z');
      expect(result[0].endDate).toBe('2025-06-30T17:45:30.456Z');
      expect(result[0].quarters![0].startDate).toBe('2024-09-01T00:00:00.000Z');
      expect(result[0].quarters![0].endDate).toBe('2024-11-15T23:59:59.999Z');
      expect(result[0].quarters![0].createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(result[0].quarters![0].updatedAt).toBe('2024-01-02T00:00:00.000Z');
      expect(result[0].createdAt).toBe('2024-01-01T12:00:00.000Z');
      expect(result[0].updatedAt).toBe('2024-01-02T14:30:00.000Z');
    });

    it('should handle school years with no quarters', async () => {
      // Arrange
      const schoolYear = {
        id: 'school-year-1',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: '2024-2025',
        startDate: new Date('2024-09-01T00:00:00.000Z'),
        endDate: new Date('2025-06-30T00:00:00.000Z'),
        isActive: true,
        quarters: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRepository.findBySchoolId).mockResolvedValue([schoolYear]);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result[0].quarters).toBeUndefined();
    });
  });
});

