import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteMonthlyAssignmentUseCase } from '../../../core/app/use-cases/deprecated/monthly-assignments/DeleteMonthlyAssignmentUseCase';
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

describe('DeleteMonthlyAssignmentUseCase', () => {
  let useCase: DeleteMonthlyAssignmentUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    useCase = new DeleteMonthlyAssignmentUseCase();
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should soft delete assignment successfully', async () => {
      const existingAssignment = {
        id: TEST_CONSTANTS.ASSIGNMENT_ID,
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        name: 'Math Assignment',
        quarter: 'Q1',
        grade: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrisma.monthlyAssignment.findFirst.mockResolvedValue(existingAssignment);
      mockPrisma.monthlyAssignment.update.mockResolvedValue({
        ...existingAssignment,
        deletedAt: new Date(),
      });

      await useCase.execute(TEST_CONSTANTS.ASSIGNMENT_ID, TEST_CONSTANTS.STUDENT_ID);

      expect(mockPrisma.monthlyAssignment.findFirst).toHaveBeenCalledWith({
        where: {
          id: TEST_CONSTANTS.ASSIGNMENT_ID,
          deletedAt: null,
          projection: {
            studentId: TEST_CONSTANTS.STUDENT_ID,
            deletedAt: null,
          },
        },
      });
      expect(mockPrisma.monthlyAssignment.update).toHaveBeenCalledWith({
        where: { id: TEST_CONSTANTS.ASSIGNMENT_ID },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw error when assignment not found', async () => {
      mockPrisma.monthlyAssignment.findFirst.mockResolvedValue(null);

      await expect(
        useCase.execute(TEST_CONSTANTS.ASSIGNMENT_ID, TEST_CONSTANTS.STUDENT_ID)
      ).rejects.toThrow('Asignación no encontrada');
    });

    it('should throw error when assignment belongs to different student', async () => {
      mockPrisma.monthlyAssignment.findFirst.mockResolvedValue(null);

      await expect(
        useCase.execute(TEST_CONSTANTS.ASSIGNMENT_ID, 'different-student-id')
      ).rejects.toThrow('Asignación no encontrada');
    });

    it('should not delete already deleted assignment', async () => {
      mockPrisma.monthlyAssignment.findFirst.mockResolvedValue(null);

      await expect(
        useCase.execute(TEST_CONSTANTS.ASSIGNMENT_ID, TEST_CONSTANTS.STUDENT_ID)
      ).rejects.toThrow('Asignación no encontrada');
    });
  });
});

