import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PreviewQuarterWeeksUseCase } from '../../../core/app/use-cases/school-years/PreviewQuarterWeeksUseCase';

// Mock the generateSchoolWeeksForQuarter utility
const mockGenerateWeeks = vi.fn();

vi.mock('../../../utils', () => ({
  generateSchoolWeeksForQuarter: (...args: any[]) => mockGenerateWeeks(...args),
}));

describe('PreviewQuarterWeeksUseCase', () => {
  let useCase: PreviewQuarterWeeksUseCase;

  beforeEach(() => {
    useCase = new PreviewQuarterWeeksUseCase();
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should convert date strings to Date objects and generate weeks', async () => {
      // Arrange
      const input = {
        startDate: '2024-09-01T00:00:00.000Z',
        endDate: '2024-11-15T00:00:00.000Z',
        weeksCount: 10,
        holidays: [],
      };

      const mockWeeks = [
        { startDate: new Date('2024-09-01T00:00:00.000Z'), endDate: new Date('2024-09-07T00:00:00.000Z') },
        { startDate: new Date('2024-09-08T00:00:00.000Z'), endDate: new Date('2024-09-14T00:00:00.000Z') },
      ];

      mockGenerateWeeks.mockReturnValue(mockWeeks);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].weekNumber).toBe(1);
      expect(result[0].startDate).toBe('2024-09-01T00:00:00.000Z');
      expect(result[0].endDate).toBe('2024-09-07T00:00:00.000Z');
      expect(result[1].weekNumber).toBe(2);
      expect(mockGenerateWeeks).toHaveBeenCalledWith({
        startDate: new Date('2024-09-01T00:00:00.000Z'),
        endDate: new Date('2024-11-15T00:00:00.000Z'),
        weeksCount: 10,
        holidays: [],
      });
    });

    it('should convert holiday date strings to Date objects', async () => {
      // Arrange
      const input = {
        startDate: '2024-09-01T00:00:00.000Z',
        endDate: '2024-11-15T00:00:00.000Z',
        weeksCount: 10,
        holidays: [
          {
            startDate: '2024-10-10T00:00:00.000Z',
            endDate: '2024-10-12T23:59:59.999Z',
          },
        ],
      };

      const mockWeeks = [
        { startDate: new Date('2024-09-01T00:00:00.000Z'), endDate: new Date('2024-09-07T00:00:00.000Z') },
      ];

      mockGenerateWeeks.mockReturnValue(mockWeeks);

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockGenerateWeeks).toHaveBeenCalledWith({
        startDate: new Date('2024-09-01T00:00:00.000Z'),
        endDate: new Date('2024-11-15T00:00:00.000Z'),
        weeksCount: 10,
        holidays: [
          {
            startDate: new Date('2024-10-10T00:00:00.000Z'),
            endDate: new Date('2024-10-12T23:59:59.999Z'),
          },
        ],
      });
    });

    it('should handle multiple holidays', async () => {
      // Arrange
      const input = {
        startDate: '2024-09-01T00:00:00.000Z',
        endDate: '2024-11-15T00:00:00.000Z',
        weeksCount: 10,
        holidays: [
          {
            startDate: '2024-10-10T00:00:00.000Z',
            endDate: '2024-10-12T00:00:00.000Z',
          },
          {
            startDate: '2024-10-20T00:00:00.000Z',
            endDate: '2024-10-22T00:00:00.000Z',
          },
        ],
      };

      const mockWeeks = [
        { startDate: new Date('2024-09-01T00:00:00.000Z'), endDate: new Date('2024-09-07T00:00:00.000Z') },
      ];

      mockGenerateWeeks.mockReturnValue(mockWeeks);

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockGenerateWeeks).toHaveBeenCalledWith({
        startDate: new Date('2024-09-01T00:00:00.000Z'),
        endDate: new Date('2024-11-15T00:00:00.000Z'),
        weeksCount: 10,
        holidays: [
          {
            startDate: new Date('2024-10-10T00:00:00.000Z'),
            endDate: new Date('2024-10-12T00:00:00.000Z'),
          },
          {
            startDate: new Date('2024-10-20T00:00:00.000Z'),
            endDate: new Date('2024-10-22T00:00:00.000Z'),
          },
        ],
      });
    });

    it('should handle undefined holidays array', async () => {
      // Arrange
      const input = {
        startDate: '2024-09-01T00:00:00.000Z',
        endDate: '2024-11-15T00:00:00.000Z',
        weeksCount: 10,
        holidays: undefined,
      };

      const mockWeeks = [
        { startDate: new Date('2024-09-01T00:00:00.000Z'), endDate: new Date('2024-09-07T00:00:00.000Z') },
      ];

      mockGenerateWeeks.mockReturnValue(mockWeeks);

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockGenerateWeeks).toHaveBeenCalledWith({
        startDate: new Date('2024-09-01T00:00:00.000Z'),
        endDate: new Date('2024-11-15T00:00:00.000Z'),
        weeksCount: 10,
        holidays: [],
      });
    });

    it('should handle null holidays array', async () => {
      // Arrange
      const input = {
        startDate: '2024-09-01T00:00:00.000Z',
        endDate: '2024-11-15T00:00:00.000Z',
        weeksCount: 10,
        holidays: undefined,
      };

      const mockWeeks = [
        { startDate: new Date('2024-09-01T00:00:00.000Z'), endDate: new Date('2024-09-07T00:00:00.000Z') },
      ];

      mockGenerateWeeks.mockReturnValue(mockWeeks);

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockGenerateWeeks).toHaveBeenCalledWith({
        startDate: new Date('2024-09-01T00:00:00.000Z'),
        endDate: new Date('2024-11-15T00:00:00.000Z'),
        weeksCount: 10,
        holidays: [],
      });
    });

    it('should convert week dates to ISO strings', async () => {
      // Arrange
      const input = {
        startDate: '2024-09-01T00:00:00.000Z',
        endDate: '2024-11-15T00:00:00.000Z',
        weeksCount: 10,
        holidays: [],
      };

      const mockWeeks = [
        { startDate: new Date('2024-09-01T08:15:30.500Z'), endDate: new Date('2024-09-07T17:45:00.250Z') },
        { startDate: new Date('2024-09-08T00:00:00.000Z'), endDate: new Date('2024-09-14T23:59:59.999Z') },
      ];

      mockGenerateWeeks.mockReturnValue(mockWeeks);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result[0].startDate).toBe('2024-09-01T08:15:30.500Z');
      expect(result[0].endDate).toBe('2024-09-07T17:45:00.250Z');
      expect(result[1].startDate).toBe('2024-09-08T00:00:00.000Z');
      expect(result[1].endDate).toBe('2024-09-14T23:59:59.999Z');
    });

    it('should number weeks starting from 1', async () => {
      // Arrange
      const input = {
        startDate: '2024-09-01T00:00:00.000Z',
        endDate: '2024-11-15T00:00:00.000Z',
        weeksCount: 10,
        holidays: [],
      };

      const mockWeeks = [
        { startDate: new Date('2024-09-01T00:00:00.000Z'), endDate: new Date('2024-09-07T00:00:00.000Z') },
        { startDate: new Date('2024-09-08T00:00:00.000Z'), endDate: new Date('2024-09-14T00:00:00.000Z') },
        { startDate: new Date('2024-09-15T00:00:00.000Z'), endDate: new Date('2024-09-21T00:00:00.000Z') },
      ];

      mockGenerateWeeks.mockReturnValue(mockWeeks);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result[0].weekNumber).toBe(1);
      expect(result[1].weekNumber).toBe(2);
      expect(result[2].weekNumber).toBe(3);
    });

    it('should handle dates with different timezone formats', async () => {
      // Arrange
      const input = {
        startDate: '2024-09-01T00:00:00Z',
        endDate: '2024-11-15T23:59:59Z',
        weeksCount: 10,
        holidays: [
          {
            startDate: '2024-10-10T00:00:00Z',
            endDate: '2024-10-12T23:59:59Z',
          },
        ],
      };

      const mockWeeks = [
        { startDate: new Date('2024-09-01T00:00:00Z'), endDate: new Date('2024-09-07T00:00:00Z') },
      ];

      mockGenerateWeeks.mockReturnValue(mockWeeks);

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockGenerateWeeks).toHaveBeenCalledWith({
        startDate: new Date('2024-09-01T00:00:00Z'),
        endDate: new Date('2024-11-15T23:59:59Z'),
        weeksCount: 10,
        holidays: [
          {
            startDate: new Date('2024-10-10T00:00:00Z'),
            endDate: new Date('2024-10-12T23:59:59Z'),
          },
        ],
      });
    });

    it('should handle empty weeks array', async () => {
      // Arrange
      const input = {
        startDate: '2024-09-01T00:00:00.000Z',
        endDate: '2024-11-15T00:00:00.000Z',
        weeksCount: 10,
        holidays: [],
      };

      mockGenerateWeeks.mockReturnValue([]);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle dates at start of day (00:00:00)', async () => {
      // Arrange
      const input = {
        startDate: '2024-09-01T00:00:00.000Z',
        endDate: '2024-11-15T00:00:00.000Z',
        weeksCount: 10,
        holidays: [],
      };

      const mockWeeks = [
        { startDate: new Date('2024-09-01T00:00:00.000Z'), endDate: new Date('2024-09-07T00:00:00.000Z') },
      ];

      mockGenerateWeeks.mockReturnValue(mockWeeks);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result[0].startDate).toBe('2024-09-01T00:00:00.000Z');
      expect(result[0].endDate).toBe('2024-09-07T00:00:00.000Z');
    });

    it('should handle dates at end of day (23:59:59)', async () => {
      // Arrange
      const input = {
        startDate: '2024-09-01T00:00:00.000Z',
        endDate: '2024-11-15T23:59:59.999Z',
        weeksCount: 10,
        holidays: [],
      };

      const mockWeeks = [
        { startDate: new Date('2024-09-01T00:00:00.000Z'), endDate: new Date('2024-09-07T23:59:59.999Z') },
      ];

      mockGenerateWeeks.mockReturnValue(mockWeeks);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result[0].startDate).toBe('2024-09-01T00:00:00.000Z');
      expect(result[0].endDate).toBe('2024-09-07T23:59:59.999Z');
    });

    it('should handle dates with milliseconds precision', async () => {
      // Arrange
      const input = {
        startDate: '2024-09-01T08:15:30.123Z',
        endDate: '2024-11-15T17:45:00.456Z',
        weeksCount: 10,
        holidays: [
          {
            startDate: '2024-10-10T10:30:15.789Z',
            endDate: '2024-10-12T20:45:30.012Z',
          },
        ],
      };

      const mockWeeks = [
        { startDate: new Date('2024-09-01T08:15:30.123Z'), endDate: new Date('2024-09-07T17:45:00.456Z') },
      ];

      mockGenerateWeeks.mockReturnValue(mockWeeks);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result[0].startDate).toBe('2024-09-01T08:15:30.123Z');
      expect(result[0].endDate).toBe('2024-09-07T17:45:00.456Z');
      expect(mockGenerateWeeks).toHaveBeenCalledWith({
        startDate: new Date('2024-09-01T08:15:30.123Z'),
        endDate: new Date('2024-11-15T17:45:00.456Z'),
        weeksCount: 10,
        holidays: [
          {
            startDate: new Date('2024-10-10T10:30:15.789Z'),
            endDate: new Date('2024-10-12T20:45:30.012Z'),
          },
        ],
      });
    });
  });
});

