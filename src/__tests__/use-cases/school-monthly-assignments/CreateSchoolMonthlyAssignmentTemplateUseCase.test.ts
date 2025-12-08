import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateSchoolMonthlyAssignmentTemplateUseCase } from '../../../core/app/use-cases/school-monthly-assignments/CreateSchoolMonthlyAssignmentTemplateUseCase';
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
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      projection: {
        findMany: vi.fn(),
      },
      monthlyAssignment: {
        findFirst: vi.fn(),
        createMany: vi.fn(),
      },
    },
  };
});

vi.mock('../../../core/frameworks/database/prisma.client', () => {
  return {
    default: mockPrismaInstance,
  };
});

describe('CreateSchoolMonthlyAssignmentTemplateUseCase', () => {
  let useCase: CreateSchoolMonthlyAssignmentTemplateUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    useCase = new CreateSchoolMonthlyAssignmentTemplateUseCase();
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should create template successfully', async () => {
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

      const template = {
        id: 'template-1',
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        quarter: 'Q1',
        name: 'Math Test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const projections = [
        { id: 'projection-1', student: { id: 'student-1' } },
        { id: 'projection-2', student: { id: 'student-2' } },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.schoolMonthlyAssignmentTemplate.findFirst.mockResolvedValue(null);
      mockPrisma.schoolMonthlyAssignmentTemplate.create.mockResolvedValue(template);
      mockPrisma.projection.findMany.mockResolvedValue(projections);
      mockPrisma.monthlyAssignment.createMany.mockResolvedValue({ count: 2 });

      const result = await useCase.execute(
        {
          name: 'Math Test',
          quarter: 'Q1',
          schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        },
        TEST_CONSTANTS.USER_ID
      );

      expect(result.id).toBe('template-1');
      expect(result.name).toBe('Math Test');
      expect(result.quarter).toBe('Q1');
      expect(result.studentsAffected).toBe(2);
      expect(mockPrisma.monthlyAssignment.createMany).toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        useCase.execute(
          {
            name: 'Math Test',
            quarter: 'Q1',
            schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
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
            name: 'Math Test',
            quarter: 'Q1',
            schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
          },
          TEST_CONSTANTS.USER_ID
        )
      ).rejects.toThrow('No tienes permiso para crear asignaciones mensuales');
    });

    it('should allow teacher to create template', async () => {
      const user = {
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        deletedAt: null,
        userRoles: [
          { role: { name: 'TEACHER' } },
        ],
      };

      const schoolYear = {
        id: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        deletedAt: null,
        name: '2024-2025',
      };

      const template = {
        id: 'template-1',
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        quarter: 'Q1',
        name: 'Math Test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.schoolMonthlyAssignmentTemplate.findFirst.mockResolvedValue(null);
      mockPrisma.schoolMonthlyAssignmentTemplate.create.mockResolvedValue(template);
      mockPrisma.projection.findMany.mockResolvedValue([]);
      mockPrisma.monthlyAssignment.createMany.mockResolvedValue({ count: 0 });

      const result = await useCase.execute(
        {
          name: 'Math Test',
          quarter: 'Q1',
          schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        },
        TEST_CONSTANTS.USER_ID
      );

      expect(result.id).toBe('template-1');
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
            name: 'Math Test',
            quarter: 'Q1',
            schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
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
            name: 'Math Test',
            quarter: 'Q5',
            schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
          },
          TEST_CONSTANTS.USER_ID
        )
      ).rejects.toThrow('Trimestre inválido');
    });

    it('should throw error when template already exists', async () => {
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

      const existingTemplate = {
        id: 'template-1',
        deletedAt: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.schoolMonthlyAssignmentTemplate.findFirst.mockResolvedValue(existingTemplate);

      await expect(
        useCase.execute(
          {
            name: 'Math Test',
            quarter: 'Q1',
            schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
          },
          TEST_CONSTANTS.USER_ID
        )
      ).rejects.toThrow('Esta asignación ya existe para este trimestre');
    });

    it('should restore soft-deleted template', async () => {
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

      const softDeletedTemplate = {
        id: 'template-1',
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        quarter: 'Q1',
        name: 'Math Test',
        deletedAt: new Date(),
      };

      const restoredTemplate = {
        ...softDeletedTemplate,
        deletedAt: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.schoolMonthlyAssignmentTemplate.findFirst.mockResolvedValue(softDeletedTemplate);
      mockPrisma.schoolMonthlyAssignmentTemplate.update.mockResolvedValue(restoredTemplate);
      mockPrisma.projection.findMany.mockResolvedValue([]);
      mockPrisma.monthlyAssignment.findFirst.mockResolvedValue(null);

      const result = await useCase.execute(
        {
          name: 'Math Test',
          quarter: 'Q1',
          schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        },
        TEST_CONSTANTS.USER_ID
      );

      expect(mockPrisma.schoolMonthlyAssignmentTemplate.update).toHaveBeenCalledWith({
        where: { id: 'template-1' },
        data: { deletedAt: null },
      });
      expect(result.id).toBe('template-1');
    });

    it('should skip creating assignments that already exist', async () => {
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

      const template = {
        id: 'template-1',
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        quarter: 'Q1',
        name: 'Math Test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const projections = [
        { id: 'projection-1', student: { id: 'student-1' } },
        { id: 'projection-2', student: { id: 'student-2' } },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.schoolMonthlyAssignmentTemplate.findFirst.mockResolvedValue(null);
      mockPrisma.schoolMonthlyAssignmentTemplate.create.mockResolvedValue(template);
      mockPrisma.projection.findMany.mockResolvedValue(projections);
      mockPrisma.monthlyAssignment.findFirst
        .mockResolvedValueOnce({ id: 'existing-assignment' })
        .mockResolvedValueOnce(null);
      mockPrisma.monthlyAssignment.createMany.mockResolvedValue({ count: 1 });

      const result = await useCase.execute(
        {
          name: 'Math Test',
          quarter: 'Q1',
          schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        },
        TEST_CONSTANTS.USER_ID
      );

      expect(result.studentsAffected).toBe(2);
      expect(mockPrisma.monthlyAssignment.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            name: 'Math Test',
            quarter: 'Q1',
          }),
        ]),
        skipDuplicates: true,
      });
    });
  });
});

