import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetQuarterGradePercentagesUseCase } from '../../../core/app/use-cases/school-monthly-assignments/GetQuarterGradePercentagesUseCase';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      user: {
        findUnique: vi.fn(),
      },
      schoolYear: {
        findFirst: vi.fn(),
      },
      quarterGradePercentage: {
        findMany: vi.fn(),
      },
    },
  };
});

vi.mock('../../../core/frameworks/database/prisma.client', () => {
  return {
    default: mockPrismaInstance,
  };
});

describe('GetQuarterGradePercentagesUseCase', () => {
  let useCase: GetQuarterGradePercentagesUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    useCase = new GetQuarterGradePercentagesUseCase();
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return percentages for all quarters', async () => {
      const user = {
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        deletedAt: null,
        userRoles: [
          { role: { name: 'SCHOOL_ADMIN' } },
        ],
      };

      const schoolYear = {
        id: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        deletedAt: null,
      };

      const percentages = [
        {
          quarter: 'Q1',
          percentage: 30,
        },
        {
          quarter: 'Q2',
          percentage: 25,
        },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.quarterGradePercentage.findMany.mockResolvedValue(percentages);

      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_YEAR_ID, TEST_CONSTANTS.USER_ID);

      expect(result.Q1).toBe(30);
      expect(result.Q2).toBe(25);
      expect(result.Q3).toBe(0);
      expect(result.Q4).toBe(0);
    });

    it('should return default 0 for quarters without percentages', async () => {
      const user = {
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        deletedAt: null,
        userRoles: [
          { role: { name: 'SCHOOL_ADMIN' } },
        ],
      };

      const schoolYear = {
        id: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        deletedAt: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.quarterGradePercentage.findMany.mockResolvedValue([]);

      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_YEAR_ID, TEST_CONSTANTS.USER_ID);

      expect(result.Q1).toBe(0);
      expect(result.Q2).toBe(0);
      expect(result.Q3).toBe(0);
      expect(result.Q4).toBe(0);
    });

    it('should throw error when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        useCase.execute(TEST_CONSTANTS.SCHOOL_YEAR_ID, TEST_CONSTANTS.USER_ID)
      ).rejects.toThrow('Usuario no encontrado');
    });

    it('should throw error when user lacks permission', async () => {
      const user = {
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        deletedAt: null,
        userRoles: [
          { role: { name: 'PARENT' } },
        ],
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(
        useCase.execute(TEST_CONSTANTS.SCHOOL_YEAR_ID, TEST_CONSTANTS.USER_ID)
      ).rejects.toThrow('No tienes permiso para ver porcentajes de calificación');
    });

    it('should throw error when school year not found', async () => {
      const user = {
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        deletedAt: null,
        userRoles: [
          { role: { name: 'SCHOOL_ADMIN' } },
        ],
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(null);

      await expect(
        useCase.execute(TEST_CONSTANTS.SCHOOL_YEAR_ID, TEST_CONSTANTS.USER_ID)
      ).rejects.toThrow('Año escolar no encontrado');
    });

    it('should order percentages by quarter', async () => {
      const user = {
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        deletedAt: null,
        userRoles: [
          { role: { name: 'SCHOOL_ADMIN' } },
        ],
      };

      const schoolYear = {
        id: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        deletedAt: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.quarterGradePercentage.findMany.mockResolvedValue([]);

      await useCase.execute(TEST_CONSTANTS.SCHOOL_YEAR_ID, TEST_CONSTANTS.USER_ID);

      expect(mockPrisma.quarterGradePercentage.findMany).toHaveBeenCalledWith({
        where: {
          schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
          deletedAt: null,
        },
        orderBy: { quarter: 'asc' },
      });
    });

    it('should return all quarters even when only some have percentages', async () => {
      const user = {
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        deletedAt: null,
        userRoles: [
          { role: { name: 'SCHOOL_ADMIN' } },
        ],
      };

      const schoolYear = {
        id: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        deletedAt: null,
      };

      const percentages = [
        {
          quarter: 'Q1',
          percentage: 30,
        },
        {
          quarter: 'Q4',
          percentage: 40,
        },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.quarterGradePercentage.findMany.mockResolvedValue(percentages);

      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_YEAR_ID, TEST_CONSTANTS.USER_ID);

      expect(result.Q1).toBe(30);
      expect(result.Q2).toBe(0);
      expect(result.Q3).toBe(0);
      expect(result.Q4).toBe(40);
    });
  });
});

