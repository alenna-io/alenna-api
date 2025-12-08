import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateSchoolYearUseCase } from '../../../core/app/use-cases/school-years/UpdateSchoolYearUseCase';
import { createMockSchoolYearRepository } from '../../utils/mockRepositories';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

describe('UpdateSchoolYearUseCase', () => {
  let useCase: UpdateSchoolYearUseCase;
  let mockRepository: ReturnType<typeof createMockSchoolYearRepository>;

  beforeEach(() => {
    mockRepository = createMockSchoolYearRepository();
    useCase = new UpdateSchoolYearUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should update school year basic fields', async () => {
      // Arrange
      const input = {
        name: '2024-2025 Updated',
        startDate: '2024-09-01T00:00:00.000Z',
        endDate: '2025-06-30T00:00:00.000Z',
        isActive: true,
      };

      const updatedSchoolYear = {
        id: 'school-year-1',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: '2024-2025 Updated',
        startDate: new Date('2024-09-01T00:00:00.000Z'),
        endDate: new Date('2025-06-30T00:00:00.000Z'),
        isActive: true,
        quarters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRepository.update).mockResolvedValue(updatedSchoolYear);

      // Act
      const result = await useCase.execute('school-year-1', input);

      // Assert
      expect(result.name).toBe('2024-2025 Updated');
      expect(result.isActive).toBe(true);
      expect(mockRepository.update).toHaveBeenCalledWith('school-year-1', {
        name: '2024-2025 Updated',
        startDate: new Date('2024-09-01T00:00:00.000Z'),
        endDate: new Date('2025-06-30T00:00:00.000Z'),
        isActive: true,
      });
    });

    it('should update only provided fields', async () => {
      // Arrange
      const input = {
        name: '2024-2025 Updated',
      };

      const updatedSchoolYear = {
        id: 'school-year-1',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: '2024-2025 Updated',
        startDate: new Date('2024-09-01T00:00:00.000Z'),
        endDate: new Date('2025-06-30T00:00:00.000Z'),
        isActive: false,
        quarters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRepository.update).mockResolvedValue(updatedSchoolYear);

      // Act
      const result = await useCase.execute('school-year-1', input);

      // Assert
      expect(result.name).toBe('2024-2025 Updated');
      expect(mockRepository.update).toHaveBeenCalledWith('school-year-1', {
        name: '2024-2025 Updated',
      });
    });

    it('should update quarters with weeks and holidays', async () => {
      // Arrange
      const input = {
        quarters: [
          {
            id: 'quarter-1',
            name: 'Q1',
            displayName: 'First Quarter',
            startDate: '2024-09-01T00:00:00.000Z',
            endDate: '2024-11-15T00:00:00.000Z',
            order: 1,
            weeksCount: 10,
            weeks: [
              {
                weekNumber: 1,
                startDate: '2024-09-01T00:00:00.000Z',
                endDate: '2024-09-07T00:00:00.000Z',
              },
            ],
            holidays: [
              {
                startDate: '2024-10-10T00:00:00.000Z',
                endDate: '2024-10-12T00:00:00.000Z',
                label: 'Fall Break',
              },
            ],
          },
        ],
      };

      const updatedSchoolYear = {
        id: 'school-year-1',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: '2024-2025',
        startDate: new Date('2024-09-01T00:00:00.000Z'),
        endDate: new Date('2025-06-30T00:00:00.000Z'),
        isActive: false,
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

      vi.mocked(mockRepository.update).mockResolvedValue(updatedSchoolYear);

      // Act
      const result = await useCase.execute('school-year-1', input);

      // Assert
      expect(result.quarters).toHaveLength(1);
      expect(mockRepository.update).toHaveBeenCalledWith('school-year-1', {
        quarters: [
          {
            id: 'quarter-1',
            name: 'Q1',
            displayName: 'First Quarter',
            startDate: new Date('2024-09-01T00:00:00.000Z'),
            endDate: new Date('2024-11-15T00:00:00.000Z'),
            order: 1,
            weeksCount: 10,
            weeks: [
              {
                weekNumber: 1,
                startDate: new Date('2024-09-01T00:00:00.000Z'),
                endDate: new Date('2024-09-07T00:00:00.000Z'),
              },
            ],
            holidays: [
              {
                startDate: new Date('2024-10-10T00:00:00.000Z'),
                endDate: new Date('2024-10-12T00:00:00.000Z'),
                label: 'Fall Break',
              },
            ],
          },
        ],
      });
    });

    it('should handle optional quarter dates', async () => {
      // Arrange
      const input = {
        quarters: [
          {
            id: 'quarter-1',
            name: 'Q1',
            displayName: 'First Quarter',
            startDate: undefined,
            endDate: undefined,
            order: 1,
            weeksCount: 10,
          },
        ],
      };

      const updatedSchoolYear = {
        id: 'school-year-1',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: '2024-2025',
        startDate: new Date('2024-09-01T00:00:00.000Z'),
        endDate: new Date('2025-06-30T00:00:00.000Z'),
        isActive: false,
        quarters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRepository.update).mockResolvedValue(updatedSchoolYear);

      // Act
      await useCase.execute('school-year-1', input);

      // Assert
      const updateCall = vi.mocked(mockRepository.update).mock.calls[0][1];
      expect(updateCall.quarters).toBeDefined();
      expect(updateCall.quarters![0].startDate).toBeUndefined();
      expect(updateCall.quarters![0].endDate).toBeUndefined();
    });
  });
});

