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
    it('should convert date strings to Date objects for school year dates', async () => {
      // Arrange
      const input = {
        startDate: '2024-09-01T00:00:00.000Z',
        endDate: '2025-06-30T23:59:59.999Z',
      };

      const updatedSchoolYear = {
        id: 'school-year-1',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: '2024-2025',
        startDate: new Date('2024-09-01T00:00:00.000Z'),
        endDate: new Date('2025-06-30T23:59:59.999Z'),
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
      expect(updateCall.startDate).toBeInstanceOf(Date);
      expect(updateCall.endDate).toBeInstanceOf(Date);
      expect(updateCall.startDate!.getTime()).toBe(new Date('2024-09-01T00:00:00.000Z').getTime());
      expect(updateCall.endDate!.getTime()).toBe(new Date('2025-06-30T23:59:59.999Z').getTime());
    });

    it('should convert quarter date strings to Date objects', async () => {
      // Arrange
      const input = {
        quarters: [
          {
            id: 'quarter-1',
            name: 'Q1',
            displayName: 'First Quarter',
            startDate: '2024-09-01T00:00:00.000Z',
            endDate: '2024-11-15T23:59:59.999Z',
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
      expect(updateCall.quarters![0].startDate).toBeInstanceOf(Date);
      expect(updateCall.quarters![0].endDate).toBeInstanceOf(Date);
      expect(updateCall.quarters![0].startDate!.getTime()).toBe(new Date('2024-09-01T00:00:00.000Z').getTime());
      expect(updateCall.quarters![0].endDate!.getTime()).toBe(new Date('2024-11-15T23:59:59.999Z').getTime());
    });

    it('should convert week date strings to Date objects', async () => {
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
                startDate: '2024-09-01T08:00:00.000Z',
                endDate: '2024-09-07T17:30:00.000Z',
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
        quarters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRepository.update).mockResolvedValue(updatedSchoolYear);

      // Act
      await useCase.execute('school-year-1', input);

      // Assert
      const updateCall = vi.mocked(mockRepository.update).mock.calls[0][1];
      expect(updateCall.quarters![0].weeks![0].startDate).toBeInstanceOf(Date);
      expect(updateCall.quarters![0].weeks![0].endDate).toBeInstanceOf(Date);
      expect(updateCall.quarters![0].weeks![0].startDate.getTime()).toBe(new Date('2024-09-01T08:00:00.000Z').getTime());
      expect(updateCall.quarters![0].weeks![0].endDate.getTime()).toBe(new Date('2024-09-07T17:30:00.000Z').getTime());
    });

    it('should convert holiday date strings to Date objects', async () => {
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
            holidays: [
              {
                startDate: '2024-10-10T00:00:00.000Z',
                endDate: '2024-10-12T23:59:59.999Z',
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
        quarters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRepository.update).mockResolvedValue(updatedSchoolYear);

      // Act
      await useCase.execute('school-year-1', input);

      // Assert
      const updateCall = vi.mocked(mockRepository.update).mock.calls[0][1];
      expect(updateCall.quarters![0].holidays![0].startDate).toBeInstanceOf(Date);
      expect(updateCall.quarters![0].holidays![0].endDate).toBeInstanceOf(Date);
      expect(updateCall.quarters![0].holidays![0].startDate.getTime()).toBe(new Date('2024-10-10T00:00:00.000Z').getTime());
      expect(updateCall.quarters![0].holidays![0].endDate.getTime()).toBe(new Date('2024-10-12T23:59:59.999Z').getTime());
    });

    it('should handle optional quarter dates (undefined)', async () => {
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

    it('should output dates as ISO strings', async () => {
      // Arrange
      const input = {
        name: '2024-2025 Updated',
      };

      const updatedSchoolYear = {
        id: 'school-year-1',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: '2024-2025 Updated',
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
      };

      vi.mocked(mockRepository.update).mockResolvedValue(updatedSchoolYear);

      // Act
      const result = await useCase.execute('school-year-1', input);

      // Assert
      expect(result.startDate).toBe('2024-09-01T08:15:30.500Z');
      expect(result.endDate).toBe('2025-06-30T17:45:00.250Z');
      expect(result.quarters![0].startDate).toBe('2024-09-01T00:00:00.000Z');
      expect(result.quarters![0].endDate).toBe('2024-11-15T23:59:59.999Z');
      expect(result.quarters![0].createdAt).toBe('2024-01-01T10:00:00.000Z');
      expect(result.quarters![0].updatedAt).toBe('2024-01-02T15:30:00.000Z');
      expect(result.createdAt).toBe('2024-01-01T12:00:00.000Z');
      expect(result.updatedAt).toBe('2024-01-02T16:45:00.000Z');
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
  });
});

