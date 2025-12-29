import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloseQuarterUseCase } from '../../../core/app/use-cases/quarters/CloseQuarterUseCase';
import prisma from '../../../core/frameworks/database/prisma.client';
import { RedistributeUnfinishedPacesUseCase } from '../../../core/app/use-cases/projections/RedistributeUnfinishedPacesUseCase';

vi.mock('../../../core/frameworks/database/prisma.client', () => ({
  default: {
    quarter: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../../../core/app/use-cases/projections/RedistributeUnfinishedPacesUseCase', () => ({
  RedistributeUnfinishedPacesUseCase: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockResolvedValue({
      redistributedPaces: 0,
      overflowPaces: [],
    }),
  })),
}));

describe('CloseQuarterUseCase', () => {
  let useCase: CloseQuarterUseCase;
  const mockPrisma = prisma as any;

  beforeEach(() => {
    useCase = new CloseQuarterUseCase();
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should close quarter successfully during grace period', async () => {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 3);

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
        schoolYear: {
          id: 'school-year-1',
          schoolId: 'school-1',
          name: '2024-2025',
        },
      };

      const updatedQuarter = {
        ...quarter,
        isClosed: true,
        closedAt: now,
        closedBy: 'user-1',
        quarterHolidays: [],
        schoolWeeks: [],
      };

      mockPrisma.quarter.findFirst.mockResolvedValue(quarter);
      mockPrisma.quarter.update.mockResolvedValue(updatedQuarter);

      const result = await useCase.execute('quarter-1', 'school-1', 'user-1');

      expect(result.isClosed).toBe(true);
      expect(result.closedAt).toBeDefined();
      expect(result.closedBy).toBe('user-1');
      expect(mockPrisma.quarter.update).toHaveBeenCalledWith({
        where: { id: 'quarter-1' },
        data: {
          isClosed: true,
          closedAt: expect.any(Date),
          closedBy: 'user-1',
        },
      });
    });

    it('should throw error when closing outside grace period', async () => {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 10);

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
        schoolYear: {
          id: 'school-year-1',
          schoolId: 'school-1',
          name: '2024-2025',
        },
      };

      mockPrisma.quarter.findFirst.mockResolvedValue(quarter);

      await expect(
        useCase.execute('quarter-1', 'school-1', 'user-1')
      ).rejects.toThrow('Grace period has ended');
    });

    it('should throw error when quarter already closed', async () => {
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
        schoolYear: {
          id: 'school-year-1',
          schoolId: 'school-1',
          name: '2024-2025',
        },
      };

      mockPrisma.quarter.findFirst.mockResolvedValue(quarter);

      await expect(
        useCase.execute('quarter-1', 'school-1', 'user-1')
      ).rejects.toThrow('Quarter is already closed');
    });

    it('should throw error when quarter does not belong to school', async () => {
      const quarter = {
        id: 'quarter-1',
        schoolYearId: 'school-year-1',
        name: 'Q1',
        displayName: 'First Quarter',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-11-15'),
        order: 1,
        weeksCount: 9,
        isClosed: false,
        closedAt: null,
        closedBy: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        schoolYear: {
          id: 'school-year-1',
          schoolId: 'school-2',
          name: '2024-2025',
        },
      };

      mockPrisma.quarter.findFirst.mockResolvedValue(quarter);

      await expect(
        useCase.execute('quarter-1', 'school-1', 'user-1')
      ).rejects.toThrow('Quarter does not belong to the specified school');
    });

    it('should trigger redistribution for all projections in school', async () => {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 3);

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
        schoolYear: {
          id: 'school-year-1',
          schoolId: 'school-1',
          name: '2024-2025',
        },
      };

      const updatedQuarter = {
        ...quarter,
        isClosed: true,
        closedAt: now,
        closedBy: 'user-1',
        quarterHolidays: [],
        schoolWeeks: [],
      };

      mockPrisma.quarter.findFirst.mockResolvedValue(quarter);
      mockPrisma.quarter.update.mockResolvedValue(updatedQuarter);

      await useCase.execute('quarter-1', 'school-1', 'user-1');

      expect(RedistributeUnfinishedPacesUseCase).toHaveBeenCalled();
    });
  });
});

