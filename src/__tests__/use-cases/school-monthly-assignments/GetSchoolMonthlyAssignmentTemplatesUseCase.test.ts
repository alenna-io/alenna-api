import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetSchoolMonthlyAssignmentTemplatesUseCase } from '../../../core/app/use-cases/school-monthly-assignments/GetSchoolMonthlyAssignmentTemplatesUseCase';
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
      schoolMonthlyAssignmentTemplate: {
        findMany: vi.fn(),
      },
      monthlyAssignment: {
        findFirst: vi.fn(),
      },
    },
  };
});

vi.mock('../../../core/frameworks/database/prisma.client', () => {
  return {
    default: mockPrismaInstance,
  };
});

describe('GetSchoolMonthlyAssignmentTemplatesUseCase', () => {
  let useCase: GetSchoolMonthlyAssignmentTemplatesUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    useCase = new GetSchoolMonthlyAssignmentTemplatesUseCase();
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return templates with grade status', async () => {
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
        name: '2024-2025',
      };

      const templates = [
        {
          id: 'template-1',
          name: 'Math Test',
          quarter: 'Q1',
          schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'template-2',
          name: 'Science Test',
          quarter: 'Q1',
          schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.schoolMonthlyAssignmentTemplate.findMany.mockResolvedValue(templates);
      mockPrisma.monthlyAssignment.findFirst
        .mockResolvedValueOnce({ id: 'assignment-with-grade' })
        .mockResolvedValueOnce(null);

      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_YEAR_ID, TEST_CONSTANTS.USER_ID);

      expect(result.length).toBe(2);
      expect(result[0].id).toBe('template-1');
      expect(result[0].hasGrades).toBe(true);
      expect(result[1].id).toBe('template-2');
      expect(result[1].hasGrades).toBe(false);
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
      ).rejects.toThrow('No tienes permiso para ver asignaciones mensuales');
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

    it('should return empty array when no templates exist', async () => {
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
        name: '2024-2025',
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.schoolMonthlyAssignmentTemplate.findMany.mockResolvedValue([]);

      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_YEAR_ID, TEST_CONSTANTS.USER_ID);

      expect(result).toEqual([]);
    });

    it('should order templates by quarter and name', async () => {
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
        name: '2024-2025',
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.schoolMonthlyAssignmentTemplate.findMany.mockResolvedValue([]);
      mockPrisma.monthlyAssignment.findFirst.mockResolvedValue(null);

      await useCase.execute(TEST_CONSTANTS.SCHOOL_YEAR_ID, TEST_CONSTANTS.USER_ID);

      expect(mockPrisma.schoolMonthlyAssignmentTemplate.findMany).toHaveBeenCalledWith({
        where: {
          schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
          deletedAt: null,
        },
        orderBy: [
          { quarter: 'asc' },
          { name: 'asc' },
        ],
      });
    });
  });
});

