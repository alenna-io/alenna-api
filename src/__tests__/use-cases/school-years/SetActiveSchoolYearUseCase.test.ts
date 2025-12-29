import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SetActiveSchoolYearUseCase } from '../../../core/app/use-cases/school-years/SetActiveSchoolYearUseCase';
import { createMockSchoolYearRepository } from '../../utils/mockRepositories';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

describe('SetActiveSchoolYearUseCase', () => {
  let useCase: SetActiveSchoolYearUseCase;
  let mockRepository: ReturnType<typeof createMockSchoolYearRepository>;

  beforeEach(() => {
    mockRepository = createMockSchoolYearRepository();
    useCase = new SetActiveSchoolYearUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should set school year as active', async () => {
      // Arrange
      const schoolYear = {
        id: 'school-year-1',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: '2024-2025',
        startDate: new Date('2024-09-01T00:00:00.000Z'),
        endDate: new Date('2025-06-30T00:00:00.000Z'),
        isActive: true,
        quarters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRepository.setActive).mockResolvedValue(schoolYear);

      // Act
      const result = await useCase.execute('school-year-1', TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result.id).toBe('school-year-1');
      expect(result.isActive).toBe(true);
      expect(mockRepository.setActive).toHaveBeenCalledWith('school-year-1', TEST_CONSTANTS.SCHOOL_ID);
    });

    it('should convert dates to ISO strings correctly', async () => {
      // Arrange
      const schoolYear = {
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
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            updatedAt: new Date('2024-01-02T00:00:00.000Z'),
          },
        ],
        createdAt: new Date('2024-01-01T12:00:00.000Z'),
        updatedAt: new Date('2024-01-02T14:30:00.000Z'),
      };

      vi.mocked(mockRepository.setActive).mockResolvedValue(schoolYear);

      // Act
      const result = await useCase.execute('school-year-1', TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result.startDate).toBe('2024-09-01T08:15:30.500Z');
      expect(result.endDate).toBe('2025-06-30T17:45:00.250Z');
      expect(result.quarters).toHaveLength(1);
      expect(result.quarters![0].name).toBe('Q1');
      expect(result.quarters![0].startDate).toBe('2024-09-01T00:00:00.000Z');
      expect(result.quarters![0].endDate).toBe('2024-11-15T23:59:59.999Z');
    });
  });
});

