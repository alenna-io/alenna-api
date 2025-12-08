import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteSchoolMonthlyAssignmentTemplateUseCase } from '../../../core/app/use-cases/school-monthly-assignments/DeleteSchoolMonthlyAssignmentTemplateUseCase';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      user: {
        findUnique: vi.fn(),
      },
      schoolMonthlyAssignmentTemplate: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      monthlyAssignment: {
        findFirst: vi.fn(),
        updateMany: vi.fn(),
      },
    },
  };
});

vi.mock('../../../core/frameworks/database/prisma.client', () => {
  return {
    default: mockPrismaInstance,
  };
});

describe('DeleteSchoolMonthlyAssignmentTemplateUseCase', () => {
  let useCase: DeleteSchoolMonthlyAssignmentTemplateUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    useCase = new DeleteSchoolMonthlyAssignmentTemplateUseCase();
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should delete template successfully when no grades exist', async () => {
      const user = {
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        deletedAt: null,
        userRoles: [
          { role: { name: 'SCHOOL_ADMIN' } },
        ],
      };

      const template = {
        id: 'template-1',
        name: 'Math Test',
        quarter: 'Q1',
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolYear: {
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          name: '2024-2025',
        },
        deletedAt: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolMonthlyAssignmentTemplate.findFirst.mockResolvedValue(template);
      mockPrisma.monthlyAssignment.findFirst.mockResolvedValue(null);
      mockPrisma.schoolMonthlyAssignmentTemplate.update.mockResolvedValue({
        ...template,
        deletedAt: new Date(),
      });
      mockPrisma.monthlyAssignment.updateMany.mockResolvedValue({ count: 5 });

      const result = await useCase.execute('template-1', TEST_CONSTANTS.USER_ID);

      expect(result.success).toBe(true);
      expect(mockPrisma.schoolMonthlyAssignmentTemplate.update).toHaveBeenCalledWith({
        where: { id: 'template-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(mockPrisma.monthlyAssignment.updateMany).toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        useCase.execute('template-1', TEST_CONSTANTS.USER_ID)
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
        useCase.execute('template-1', TEST_CONSTANTS.USER_ID)
      ).rejects.toThrow('No tienes permiso para eliminar asignaciones mensuales');
    });

    it('should throw error when template not found', async () => {
      const user = {
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        deletedAt: null,
        userRoles: [
          { role: { name: 'SCHOOL_ADMIN' } },
        ],
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolMonthlyAssignmentTemplate.findFirst.mockResolvedValue(null);

      await expect(
        useCase.execute('template-1', TEST_CONSTANTS.USER_ID)
      ).rejects.toThrow('Plantilla de asignación no encontrada');
    });

    it('should throw error when template belongs to different school', async () => {
      const user = {
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        deletedAt: null,
        userRoles: [
          { role: { name: 'SCHOOL_ADMIN' } },
        ],
      };

      const template = {
        id: 'template-1',
        name: 'Math Test',
        quarter: 'Q1',
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolYear: {
          schoolId: 'different-school',
          name: '2024-2025',
        },
        deletedAt: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolMonthlyAssignmentTemplate.findFirst.mockResolvedValue(template);

      await expect(
        useCase.execute('template-1', TEST_CONSTANTS.USER_ID)
      ).rejects.toThrow('No tienes permiso para eliminar esta asignación');
    });

    it('should throw error when template has grades', async () => {
      const user = {
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        deletedAt: null,
        userRoles: [
          { role: { name: 'SCHOOL_ADMIN' } },
        ],
      };

      const template = {
        id: 'template-1',
        name: 'Math Test',
        quarter: 'Q1',
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolYear: {
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          name: '2024-2025',
        },
        deletedAt: null,
      };

      const assignmentWithGrade = {
        id: 'assignment-1',
        grade: 85,
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolMonthlyAssignmentTemplate.findFirst.mockResolvedValue(template);
      mockPrisma.monthlyAssignment.findFirst.mockResolvedValue(assignmentWithGrade);

      await expect(
        useCase.execute('template-1', TEST_CONSTANTS.USER_ID)
      ).rejects.toThrow('No se puede eliminar una asignación que ya tiene calificaciones');
    });

    it('should soft delete all related monthly assignments', async () => {
      const user = {
        id: TEST_CONSTANTS.USER_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        deletedAt: null,
        userRoles: [
          { role: { name: 'SCHOOL_ADMIN' } },
        ],
      };

      const template = {
        id: 'template-1',
        name: 'Math Test',
        quarter: 'Q1',
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolYear: {
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          name: '2024-2025',
        },
        deletedAt: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolMonthlyAssignmentTemplate.findFirst.mockResolvedValue(template);
      mockPrisma.monthlyAssignment.findFirst.mockResolvedValue(null);
      mockPrisma.schoolMonthlyAssignmentTemplate.update.mockResolvedValue({
        ...template,
        deletedAt: new Date(),
      });
      mockPrisma.monthlyAssignment.updateMany.mockResolvedValue({ count: 10 });

      await useCase.execute('template-1', TEST_CONSTANTS.USER_ID);

      expect(mockPrisma.monthlyAssignment.updateMany).toHaveBeenCalledWith({
        where: {
          name: 'Math Test',
          quarter: 'Q1',
          projection: {
            student: {
              schoolId: TEST_CONSTANTS.SCHOOL_ID,
            },
            schoolYear: '2024-2025',
          },
          deletedAt: null,
        },
        data: {
          deletedAt: expect.any(Date),
        },
      });
    });
  });
});

