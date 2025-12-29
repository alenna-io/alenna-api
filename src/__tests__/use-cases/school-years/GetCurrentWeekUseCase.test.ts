import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetCurrentWeekUseCase } from '../../../core/app/use-cases/school-years/GetCurrentWeekUseCase';
import { createMockSchoolYearRepository } from '../../utils/mockRepositories';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

describe('GetCurrentWeekUseCase', () => {
  let useCase: GetCurrentWeekUseCase;
  let mockRepository: ReturnType<typeof createMockSchoolYearRepository>;

  beforeEach(() => {
    mockRepository = createMockSchoolYearRepository();
    useCase = new GetCurrentWeekUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return current week info when found', async () => {
      // Arrange
      const currentWeekInfo = {
        schoolYear: {
          id: 'school-year-1',
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          name: '2024-2025',
          startDate: new Date('2024-09-01T00:00:00.000Z'),
          endDate: new Date('2025-06-30T00:00:00.000Z'),
          isActive: true,
          quarters: [],
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-02T00:00:00.000Z'),
        },
        currentQuarter: {
          id: 'quarter-1',
          schoolYearId: 'school-year-1',
          name: 'Q1',
          displayName: 'First Quarter',
          startDate: new Date('2024-09-01T00:00:00.000Z'),
          endDate: new Date('2024-11-15T00:00:00.000Z'),
          order: 1,
          weeksCount: 10,
          isClosed: false,
          closedAt: undefined,
          closedBy: undefined,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-02T00:00:00.000Z'),
        },
        currentWeek: 5,
        weekStartDate: new Date('2024-10-01T00:00:00.000Z'),
        weekEndDate: new Date('2024-10-07T23:59:59.999Z'),
      };

      vi.mocked(mockRepository.getCurrentWeek).mockResolvedValue(currentWeekInfo);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.schoolYear.id).toBe('school-year-1');
      expect(result?.currentQuarter?.id).toBe('quarter-1');
      expect(result?.currentWeek).toBe(5);
      expect(result?.weekStartDate).toBe('2024-10-01T00:00:00.000Z');
      expect(result?.weekEndDate).toBe('2024-10-07T23:59:59.999Z');
      expect(mockRepository.getCurrentWeek).toHaveBeenCalledWith(TEST_CONSTANTS.SCHOOL_ID);
    });

    it('should return null when no active school year found', async () => {
      // Arrange
      vi.mocked(mockRepository.getCurrentWeek).mockResolvedValue(null);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result).toBeNull();
    });

    it('should convert all dates to ISO strings', async () => {
      // Arrange
      const currentWeekInfo = {
        schoolYear: {
          id: 'school-year-1',
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          name: '2024-2025',
          startDate: new Date('2024-09-01T08:15:30.500Z'),
          endDate: new Date('2025-06-30T17:45:00.250Z'),
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
              createdAt: new Date('2024-01-01T10:00:00.000Z'),
              updatedAt: new Date('2024-01-02T15:30:00.000Z'),
            },
          ],
          createdAt: new Date('2024-01-01T12:00:00.000Z'),
          updatedAt: new Date('2024-01-02T16:45:00.000Z'),
        },
        currentQuarter: {
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
          createdAt: new Date('2024-01-01T10:00:00.000Z'),
          updatedAt: new Date('2024-01-02T15:30:00.000Z'),
        },
        currentWeek: 3,
        weekStartDate: new Date('2024-09-15T08:00:00.000Z'),
        weekEndDate: new Date('2024-09-21T17:30:00.000Z'),
      };

      vi.mocked(mockRepository.getCurrentWeek).mockResolvedValue(currentWeekInfo);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result?.schoolYear.startDate).toBe('2024-09-01T08:15:30.500Z');
      expect(result?.schoolYear.endDate).toBe('2025-06-30T17:45:00.250Z');
      expect(result?.schoolYear.createdAt).toBe('2024-01-01T12:00:00.000Z');
      expect(result?.schoolYear.updatedAt).toBe('2024-01-02T16:45:00.000Z');
      expect(result?.currentQuarter?.startDate).toBe('2024-09-01T00:00:00.000Z');
      expect(result?.currentQuarter?.endDate).toBe('2024-11-15T23:59:59.999Z');
      expect(result?.currentQuarter?.createdAt).toBe('2024-01-01T10:00:00.000Z');
      expect(result?.currentQuarter?.updatedAt).toBe('2024-01-02T15:30:00.000Z');
      expect(result?.weekStartDate).toBe('2024-09-15T08:00:00.000Z');
      expect(result?.weekEndDate).toBe('2024-09-21T17:30:00.000Z');
    });

    it('should handle null currentQuarter', async () => {
      // Arrange
      const currentWeekInfo = {
        schoolYear: {
          id: 'school-year-1',
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          name: '2024-2025',
          startDate: new Date('2024-09-01T00:00:00.000Z'),
          endDate: new Date('2025-06-30T00:00:00.000Z'),
          isActive: true,
          quarters: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        currentQuarter: null,
        currentWeek: null,
        weekStartDate: null,
        weekEndDate: null,
      };

      vi.mocked(mockRepository.getCurrentWeek).mockResolvedValue(currentWeekInfo);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result?.currentQuarter).toBeNull();
      expect(result?.currentWeek).toBeNull();
      expect(result?.weekStartDate).toBeNull();
      expect(result?.weekEndDate).toBeNull();
    });

    it('should handle null weekStartDate and weekEndDate', async () => {
      // Arrange
      const currentWeekInfo = {
        schoolYear: {
          id: 'school-year-1',
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          name: '2024-2025',
          startDate: new Date('2024-09-01T00:00:00.000Z'),
          endDate: new Date('2025-06-30T00:00:00.000Z'),
          isActive: true,
          quarters: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        currentQuarter: {
          id: 'quarter-1',
          schoolYearId: 'school-year-1',
          name: 'Q1',
          displayName: 'First Quarter',
          startDate: new Date('2024-09-01T00:00:00.000Z'),
          endDate: new Date('2024-11-15T00:00:00.000Z'),
          order: 1,
          weeksCount: 10,
          isClosed: false,
          closedAt: undefined,
          closedBy: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        currentWeek: null,
        weekStartDate: null,
        weekEndDate: null,
      };

      vi.mocked(mockRepository.getCurrentWeek).mockResolvedValue(currentWeekInfo);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result?.currentQuarter).not.toBeNull();
      expect(result?.currentWeek).toBeNull();
      expect(result?.weekStartDate).toBeNull();
      expect(result?.weekEndDate).toBeNull();
    });

    it('should handle dates at start of day (00:00:00)', async () => {
      // Arrange
      const currentWeekInfo = {
        schoolYear: {
          id: 'school-year-1',
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          name: '2024-2025',
          startDate: new Date('2024-09-01T00:00:00.000Z'),
          endDate: new Date('2025-06-30T00:00:00.000Z'),
          isActive: true,
          quarters: [],
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-02T00:00:00.000Z'),
        },
        currentQuarter: {
          id: 'quarter-1',
          schoolYearId: 'school-year-1',
          name: 'Q1',
          displayName: 'First Quarter',
          startDate: new Date('2024-09-01T00:00:00.000Z'),
          endDate: new Date('2024-11-15T00:00:00.000Z'),
          order: 1,
          weeksCount: 10,
          isClosed: false,
          closedAt: undefined,
          closedBy: undefined,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-02T00:00:00.000Z'),
        },
        currentWeek: 1,
        weekStartDate: new Date('2024-09-01T00:00:00.000Z'),
        weekEndDate: new Date('2024-09-07T00:00:00.000Z'),
      };

      vi.mocked(mockRepository.getCurrentWeek).mockResolvedValue(currentWeekInfo);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result?.weekStartDate).toBe('2024-09-01T00:00:00.000Z');
      expect(result?.weekEndDate).toBe('2024-09-07T00:00:00.000Z');
    });

    it('should handle dates at end of day (23:59:59)', async () => {
      // Arrange
      const currentWeekInfo = {
        schoolYear: {
          id: 'school-year-1',
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          name: '2024-2025',
          startDate: new Date('2024-09-01T00:00:00.000Z'),
          endDate: new Date('2025-06-30T23:59:59.999Z'),
          isActive: true,
          quarters: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        currentQuarter: {
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
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        currentWeek: 10,
        weekStartDate: new Date('2024-11-10T00:00:00.000Z'),
        weekEndDate: new Date('2024-11-15T23:59:59.999Z'),
      };

      vi.mocked(mockRepository.getCurrentWeek).mockResolvedValue(currentWeekInfo);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result?.schoolYear.endDate).toBe('2025-06-30T23:59:59.999Z');
      expect(result?.currentQuarter?.endDate).toBe('2024-11-15T23:59:59.999Z');
      expect(result?.weekEndDate).toBe('2024-11-15T23:59:59.999Z');
    });

    it('should handle school year with multiple quarters', async () => {
      // Arrange
      const currentWeekInfo = {
        schoolYear: {
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
              isClosed: false,
              closedAt: undefined,
              closedBy: undefined,
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
              isClosed: false,
              closedAt: undefined,
              closedBy: undefined,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        currentQuarter: {
          id: 'quarter-2',
          schoolYearId: 'school-year-1',
          name: 'Q2',
          displayName: 'Second Quarter',
          startDate: new Date('2024-11-16T00:00:00.000Z'),
          endDate: new Date('2025-02-15T00:00:00.000Z'),
          order: 2,
          weeksCount: 12,
          isClosed: false,
          closedAt: undefined,
          closedBy: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        currentWeek: 3,
        weekStartDate: new Date('2024-12-01T00:00:00.000Z'),
        weekEndDate: new Date('2024-12-07T00:00:00.000Z'),
      };

      vi.mocked(mockRepository.getCurrentWeek).mockResolvedValue(currentWeekInfo);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result?.schoolYear.quarters).toHaveLength(2);
      expect(result?.currentQuarter?.name).toBe('Q2');
      expect(result?.currentWeek).toBe(3);
    });
  });
});

