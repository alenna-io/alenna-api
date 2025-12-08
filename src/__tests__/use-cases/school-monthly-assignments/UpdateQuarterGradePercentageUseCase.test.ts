import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateQuarterGradePercentageUseCase } from '../../../core/app/use-cases/school-monthly-assignments/UpdateQuarterGradePercentageUseCase';
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
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

vi.mock('../../../core/frameworks/database/prisma.client', () => {
  return {
    default: mockPrismaInstance,
  };
});

describe('UpdateQuarterGradePercentageUseCase', () => {
  let useCase: UpdateQuarterGradePercentageUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    useCase = new UpdateQuarterGradePercentageUseCase();
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should create percentage when it does not exist', async () => {
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

      const createdPercentage = {
        id: 'percentage-1',
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        quarter: 'Q1',
        percentage: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.quarterGradePercentage.findFirst.mockResolvedValue(null);
      mockPrisma.quarterGradePercentage.create.mockResolvedValue(createdPercentage);

      const result = await useCase.execute(
        {
          schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
          quarter: 'Q1',
          percentage: 30,
        },
        TEST_CONSTANTS.USER_ID
      );

      expect(result.quarter).toBe('Q1');
      expect(result.percentage).toBe(30);
      expect(mockPrisma.quarterGradePercentage.create).toHaveBeenCalled();
    });

    it('should update percentage when it exists', async () => {
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

      const existingPercentage = {
        id: 'percentage-1',
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        quarter: 'Q1',
        percentage: 20,
        deletedAt: null,
      };

      const updatedPercentage = {
        ...existingPercentage,
        percentage: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.quarterGradePercentage.findFirst.mockResolvedValue(existingPercentage);
      mockPrisma.quarterGradePercentage.update.mockResolvedValue(updatedPercentage);

      const result = await useCase.execute(
        {
          schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
          quarter: 'Q1',
          percentage: 30,
        },
        TEST_CONSTANTS.USER_ID
      );

      expect(result.percentage).toBe(30);
      expect(mockPrisma.quarterGradePercentage.update).toHaveBeenCalledWith({
        where: { id: 'percentage-1' },
        data: { percentage: 30 },
      });
    });

    it('should throw error when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        useCase.execute(
          {
            schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
            quarter: 'Q1',
            percentage: 30,
          },
          TEST_CONSTANTS.USER_ID
        )
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
        useCase.execute(
          {
            schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
            quarter: 'Q1',
            percentage: 30,
          },
          TEST_CONSTANTS.USER_ID
        )
      ).rejects.toThrow('No tienes permiso para actualizar porcentajes de calificación');
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
        useCase.execute(
          {
            schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
            quarter: 'Q1',
            percentage: 30,
          },
          TEST_CONSTANTS.USER_ID
        )
      ).rejects.toThrow('Año escolar no encontrado');
    });

    it('should throw error for invalid quarter', async () => {
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

      await expect(
        useCase.execute(
          {
            schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
            quarter: 'Q5',
            percentage: 30,
          },
          TEST_CONSTANTS.USER_ID
        )
      ).rejects.toThrow('Trimestre inválido');
    });

    it('should throw error when percentage is less than 0', async () => {
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

      await expect(
        useCase.execute(
          {
            schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
            quarter: 'Q1',
            percentage: -1,
          },
          TEST_CONSTANTS.USER_ID
        )
      ).rejects.toThrow('El porcentaje debe estar entre 0 y 100');
    });

    it('should throw error when percentage is greater than 100', async () => {
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

      await expect(
        useCase.execute(
          {
            schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
            quarter: 'Q1',
            percentage: 101,
          },
          TEST_CONSTANTS.USER_ID
        )
      ).rejects.toThrow('El porcentaje debe estar entre 0 y 100');
    });

    it('should allow percentage of 0', async () => {
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

      const createdPercentage = {
        id: 'percentage-1',
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        quarter: 'Q1',
        percentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.quarterGradePercentage.findFirst.mockResolvedValue(null);
      mockPrisma.quarterGradePercentage.create.mockResolvedValue(createdPercentage);

      const result = await useCase.execute(
        {
          schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
          quarter: 'Q1',
          percentage: 0,
        },
        TEST_CONSTANTS.USER_ID
      );

      expect(result.percentage).toBe(0);
    });

    it('should allow percentage of 100', async () => {
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

      const createdPercentage = {
        id: 'percentage-1',
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        quarter: 'Q1',
        percentage: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.quarterGradePercentage.findFirst.mockResolvedValue(null);
      mockPrisma.quarterGradePercentage.create.mockResolvedValue(createdPercentage);

      const result = await useCase.execute(
        {
          schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
          quarter: 'Q1',
          percentage: 100,
        },
        TEST_CONSTANTS.USER_ID
      );

      expect(result.percentage).toBe(100);
    });
  });
});

