import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateMonthlyAssignmentUseCase } from '../../../core/app/use-cases/deprecated/monthly-assignments/UpdateMonthlyAssignmentUseCase';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      monthlyAssignment: {
        findFirst: vi.fn(),
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

describe('UpdateMonthlyAssignmentUseCase', () => {
  let useCase: UpdateMonthlyAssignmentUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    useCase = new UpdateMonthlyAssignmentUseCase();
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should update assignment name successfully', async () => {
      const existingAssignment = {
        id: TEST_CONSTANTS.ASSIGNMENT_ID,
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        name: 'Old Name',
        quarter: 'Q1',
        grade: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const updatedAssignment = {
        ...existingAssignment,
        name: 'New Name',
        updatedAt: new Date(),
      };

      mockPrisma.monthlyAssignment.findFirst.mockResolvedValue(existingAssignment);
      mockPrisma.monthlyAssignment.update.mockResolvedValue(updatedAssignment);

      const result = await useCase.execute(
        TEST_CONSTANTS.ASSIGNMENT_ID,
        {
          name: 'New Name',
        },
        TEST_CONSTANTS.STUDENT_ID
      );

      expect(result.name).toBe('New Name');
      expect(mockPrisma.monthlyAssignment.update).toHaveBeenCalledWith({
        where: { id: TEST_CONSTANTS.ASSIGNMENT_ID },
        data: {
          name: 'New Name',
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should trim assignment name when updating', async () => {
      const existingAssignment = {
        id: TEST_CONSTANTS.ASSIGNMENT_ID,
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        name: 'Old Name',
        quarter: 'Q1',
        grade: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrisma.monthlyAssignment.findFirst.mockResolvedValue(existingAssignment);
      mockPrisma.monthlyAssignment.update.mockResolvedValue(existingAssignment);

      await useCase.execute(
        TEST_CONSTANTS.ASSIGNMENT_ID,
        {
          name: '  New Name  ',
        },
        TEST_CONSTANTS.STUDENT_ID
      );

      expect(mockPrisma.monthlyAssignment.update).toHaveBeenCalledWith({
        where: { id: TEST_CONSTANTS.ASSIGNMENT_ID },
        data: {
          name: 'New Name',
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should throw error when assignment not found', async () => {
      mockPrisma.monthlyAssignment.findFirst.mockResolvedValue(null);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.ASSIGNMENT_ID,
          { name: 'New Name' },
          TEST_CONSTANTS.STUDENT_ID
        )
      ).rejects.toThrow('Asignación no encontrada');
    });

    it('should throw error when assignment belongs to different student', async () => {
      mockPrisma.monthlyAssignment.findFirst.mockResolvedValue(null);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.ASSIGNMENT_ID,
          { name: 'New Name' },
          'different-student-id'
        )
      ).rejects.toThrow('Asignación no encontrada');
    });

    it('should throw error when name is empty', async () => {
      const existingAssignment = {
        id: TEST_CONSTANTS.ASSIGNMENT_ID,
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        name: 'Old Name',
        quarter: 'Q1',
        grade: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrisma.monthlyAssignment.findFirst.mockResolvedValue(existingAssignment);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.ASSIGNMENT_ID,
          { name: '' },
          TEST_CONSTANTS.STUDENT_ID
        )
      ).rejects.toThrow('El nombre de la asignación es requerido');
    });

    it('should throw error when name is only whitespace', async () => {
      const existingAssignment = {
        id: TEST_CONSTANTS.ASSIGNMENT_ID,
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        name: 'Old Name',
        quarter: 'Q1',
        grade: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrisma.monthlyAssignment.findFirst.mockResolvedValue(existingAssignment);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.ASSIGNMENT_ID,
          { name: '   ' },
          TEST_CONSTANTS.STUDENT_ID
        )
      ).rejects.toThrow('El nombre de la asignación es requerido');
    });

    it('should not update if name is undefined', async () => {
      const existingAssignment = {
        id: TEST_CONSTANTS.ASSIGNMENT_ID,
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        name: 'Old Name',
        quarter: 'Q1',
        grade: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrisma.monthlyAssignment.findFirst.mockResolvedValue(existingAssignment);
      mockPrisma.monthlyAssignment.update.mockResolvedValue(existingAssignment);

      await useCase.execute(
        TEST_CONSTANTS.ASSIGNMENT_ID,
        {},
        TEST_CONSTANTS.STUDENT_ID
      );

      expect(mockPrisma.monthlyAssignment.update).toHaveBeenCalledWith({
        where: { id: TEST_CONSTANTS.ASSIGNMENT_ID },
        data: {
          updatedAt: expect.any(Date),
        },
      });
    });
  });
});

