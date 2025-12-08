import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateSchoolYearUseCase } from '../../../core/app/use-cases/school-years/CreateSchoolYearUseCase';
import { createMockSchoolYearRepository } from '../../utils/mockRepositories';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

describe('CreateSchoolYearUseCase', () => {
  let useCase: CreateSchoolYearUseCase;
  let mockRepository: ReturnType<typeof createMockSchoolYearRepository>;

  beforeEach(() => {
    mockRepository = createMockSchoolYearRepository();
    useCase = new CreateSchoolYearUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should create school year with quarters and weeks', async () => {
      // Arrange
      const input = {
        name: '2024-2025',
        startDate: '2024-09-01T00:00:00.000Z',
        endDate: '2025-06-30T00:00:00.000Z',
        isActive: false,
        quarters: [
          {
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

      const createdSchoolYear = {
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

      vi.mocked(mockRepository.create).mockResolvedValue(createdSchoolYear);

      // Act
      const result = await useCase.execute(input, TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result.id).toBe('school-year-1');
      expect(result.name).toBe('2024-2025');
      expect(result.schoolId).toBe(TEST_CONSTANTS.SCHOOL_ID);
      expect(result.isActive).toBe(false);
      expect(result.quarters).toHaveLength(1);
      expect(result.quarters[0].name).toBe('Q1');
      expect(mockRepository.create).toHaveBeenCalledWith({
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: '2024-2025',
        startDate: new Date('2024-09-01T00:00:00.000Z'),
        endDate: new Date('2025-06-30T00:00:00.000Z'),
        isActive: false,
        quarters: [
          {
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

    it('should create school year with multiple quarters', async () => {
      // Arrange
      const input = {
        name: '2024-2025',
        startDate: '2024-09-01T00:00:00.000Z',
        endDate: '2025-06-30T00:00:00.000Z',
        isActive: true,
        quarters: [
          {
            name: 'Q1',
            displayName: 'First Quarter',
            startDate: '2024-09-01T00:00:00.000Z',
            endDate: '2024-11-15T00:00:00.000Z',
            order: 1,
            weeksCount: 10,
          },
          {
            name: 'Q2',
            displayName: 'Second Quarter',
            startDate: '2024-11-16T00:00:00.000Z',
            endDate: '2025-02-15T00:00:00.000Z',
            order: 2,
            weeksCount: 12,
          },
        ],
      };

      const createdSchoolYear = {
        id: 'school-year-1',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
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
          {
            id: 'quarter-2',
            schoolYearId: 'school-year-1',
            name: 'Q2',
            displayName: 'Second Quarter',
            startDate: new Date('2024-11-16T00:00:00.000Z'),
            endDate: new Date('2025-02-15T00:00:00.000Z'),
            order: 2,
            weeksCount: 12,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRepository.create).mockResolvedValue(createdSchoolYear);

      // Act
      const result = await useCase.execute(input, TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result.quarters).toHaveLength(2);
      expect(result.quarters[0].order).toBe(1);
      expect(result.quarters[1].order).toBe(2);
    });

    it('should convert date strings to Date objects', async () => {
      // Arrange
      const input = {
        name: '2024-2025',
        startDate: '2024-09-01T00:00:00.000Z',
        endDate: '2025-06-30T00:00:00.000Z',
        isActive: false,
        quarters: [],
      };

      const createdSchoolYear = {
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

      vi.mocked(mockRepository.create).mockResolvedValue(createdSchoolYear);

      // Act
      await useCase.execute(input, TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      const createCall = vi.mocked(mockRepository.create).mock.calls[0][0];
      expect(createCall.startDate).toBeInstanceOf(Date);
      expect(createCall.endDate).toBeInstanceOf(Date);
    });
  });
});

