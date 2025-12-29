import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetQuartersStatusUseCase } from '../../../core/app/use-cases/quarters/GetQuartersStatusUseCase';
import prisma from '../../../core/frameworks/database/prisma.client';

vi.mock('../../../core/frameworks/database/prisma.client', () => ({
  default: {
    schoolYear: {
      findFirst: vi.fn(),
    },
    quarter: {
      findMany: vi.fn(),
    },
  },
}));

describe('GetQuartersStatusUseCase', () => {
  let useCase: GetQuartersStatusUseCase;
  const mockPrisma = prisma as any;

  beforeEach(() => {
    useCase = new GetQuartersStatusUseCase();
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return open status for quarter before end date', async () => {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 7);

      const schoolYear = {
        id: 'school-year-1',
        schoolId: 'school-1',
        name: '2024-2025',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-06-30'),
        isActive: true,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const quarter = {
        id: 'quarter-1',
        schoolYearId: 'school-year-1',
        name: 'Q1',
        displayName: 'First Quarter',
        startDate: new Date('2024-09-01'),
        endDate,
        order: 1,
        weeksCount: 9,
        isClosed: false,
        closedAt: null,
        closedBy: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        quarterHolidays: [],
        schoolWeeks: [],
      };

      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.quarter.findMany.mockResolvedValue([quarter]);

      const result = await useCase.execute('school-year-1', 'school-1');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('open');
      expect(result[0].canClose).toBe(false);
    });

    it('should return grace period status for quarter within 1 week after end date', async () => {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 3);

      const schoolYear = {
        id: 'school-year-1',
        schoolId: 'school-1',
        name: '2024-2025',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-06-30'),
        isActive: true,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const quarter = {
        id: 'quarter-1',
        schoolYearId: 'school-year-1',
        name: 'Q1',
        displayName: 'First Quarter',
        startDate: new Date('2024-09-01'),
        endDate,
        order: 1,
        weeksCount: 9,
        isClosed: false,
        closedAt: null,
        closedBy: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        quarterHolidays: [],
        schoolWeeks: [],
      };

      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.quarter.findMany.mockResolvedValue([quarter]);

      const result = await useCase.execute('school-year-1', 'school-1');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('gracePeriod');
      expect(result[0].canClose).toBe(true);
    });

    it('should return closed status for closed quarter', async () => {
      const schoolYear = {
        id: 'school-year-1',
        schoolId: 'school-1',
        name: '2024-2025',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-06-30'),
        isActive: true,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const quarter = {
        id: 'quarter-1',
        schoolYearId: 'school-year-1',
        name: 'Q1',
        displayName: 'First Quarter',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-11-15'),
        order: 1,
        weeksCount: 9,
        isClosed: true,
        closedAt: new Date(),
        closedBy: 'user-1',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        quarterHolidays: [],
        schoolWeeks: [],
      };

      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.quarter.findMany.mockResolvedValue([quarter]);

      const result = await useCase.execute('school-year-1', 'school-1');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('closed');
      expect(result[0].canClose).toBe(false);
    });

    it('should throw error when school year not found', async () => {
      mockPrisma.schoolYear.findFirst.mockResolvedValue(null);

      await expect(
        useCase.execute('school-year-1', 'school-1')
      ).rejects.toThrow('School year not found');
    });
  });
});

