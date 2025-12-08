import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateSchoolMonthlyAssignmentTemplateUseCase } from '../../../core/app/use-cases/school-monthly-assignments/UpdateSchoolMonthlyAssignmentTemplateUseCase';
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

describe('UpdateSchoolMonthlyAssignmentTemplateUseCase', () => {
  let useCase: UpdateSchoolMonthlyAssignmentTemplateUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    useCase = new UpdateSchoolMonthlyAssignmentTemplateUseCase();
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should update template name successfully', async () => {
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
        name: 'Old Name',
        quarter: 'Q1',
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolYear: {
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          name: '2024-2025',
        },
        deletedAt: null,
      };

      const updatedTemplate = {
        ...template,
        name: 'New Name',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolMonthlyAssignmentTemplate.findFirst
        .mockResolvedValueOnce(template)
        .mockResolvedValueOnce(null);
      mockPrisma.schoolMonthlyAssignmentTemplate.update.mockResolvedValue(updatedTemplate);
      mockPrisma.monthlyAssignment.updateMany.mockResolvedValue({ count: 5 });

      const result = await useCase.execute(
        'template-1',
        { name: 'New Name' },
        TEST_CONSTANTS.USER_ID
      );

      expect(result.name).toBe('New Name');
      expect(mockPrisma.monthlyAssignment.updateMany).toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        useCase.execute('template-1', { name: 'New Name' }, TEST_CONSTANTS.USER_ID)
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
        useCase.execute('template-1', { name: 'New Name' }, TEST_CONSTANTS.USER_ID)
      ).rejects.toThrow('No tienes permiso para editar asignaciones mensuales');
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
        useCase.execute('template-1', { name: 'New Name' }, TEST_CONSTANTS.USER_ID)
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
        name: 'Old Name',
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
        useCase.execute('template-1', { name: 'New Name' }, TEST_CONSTANTS.USER_ID)
      ).rejects.toThrow('No tienes permiso para editar esta asignación');
    });

    it('should throw error when new name already exists for quarter', async () => {
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
        name: 'Old Name',
        quarter: 'Q1',
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolYear: {
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          name: '2024-2025',
        },
        deletedAt: null,
      };

      const existingTemplate = {
        id: 'template-2',
        name: 'New Name',
        quarter: 'Q1',
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        deletedAt: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolMonthlyAssignmentTemplate.findFirst
        .mockResolvedValueOnce(template)
        .mockResolvedValueOnce(existingTemplate);

      await expect(
        useCase.execute('template-1', { name: 'New Name' }, TEST_CONSTANTS.USER_ID)
      ).rejects.toThrow('Ya existe una asignación con este nombre para este trimestre');
    });

    it('should update all related monthly assignments', async () => {
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
        name: 'Old Name',
        quarter: 'Q1',
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolYear: {
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          name: '2024-2025',
        },
        deletedAt: null,
      };

      const updatedTemplate = {
        ...template,
        name: 'New Name',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.schoolMonthlyAssignmentTemplate.findFirst
        .mockResolvedValueOnce(template)
        .mockResolvedValueOnce(null);
      mockPrisma.schoolMonthlyAssignmentTemplate.update.mockResolvedValue(updatedTemplate);
      mockPrisma.monthlyAssignment.updateMany.mockResolvedValue({ count: 10 });

      await useCase.execute('template-1', { name: 'New Name' }, TEST_CONSTANTS.USER_ID);

      expect(mockPrisma.monthlyAssignment.updateMany).toHaveBeenCalledWith({
        where: {
          name: 'Old Name',
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
          name: 'New Name',
        },
      });
    });
  });
});

