import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GradeMonthlyAssignmentUseCase } from '../../../core/app/use-cases/monthly-assignments/GradeMonthlyAssignmentUseCase';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      monthlyAssignment: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      monthlyAssignmentGradeHistory: {
        create: vi.fn(),
      },
    },
  };
});

vi.mock('../../../core/frameworks/database/prisma.client', () => {
  return {
    default: mockPrismaInstance,
  };
});

describe('GradeMonthlyAssignmentUseCase', () => {
  let useCase: GradeMonthlyAssignmentUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    useCase = new GradeMonthlyAssignmentUseCase();
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should grade assignment successfully', async () => {
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

      const updatedAssignment = {
        ...existingAssignment,
        grade: 85,
        updatedAt: new Date(),
      };

      mockPrisma.monthlyAssignment.findFirst.mockResolvedValue(existingAssignment);
      mockPrisma.monthlyAssignmentGradeHistory.create.mockResolvedValue({});
      mockPrisma.monthlyAssignment.update.mockResolvedValue(updatedAssignment);

      const result = await useCase.execute(
        TEST_CONSTANTS.ASSIGNMENT_ID,
        {
          grade: 85,
        },
        TEST_CONSTANTS.STUDENT_ID
      );

      expect(result.grade).toBe(85);
      expect(mockPrisma.monthlyAssignmentGradeHistory.create).toHaveBeenCalledWith({
        data: {
          id: expect.any(String),
          monthlyAssignmentId: TEST_CONSTANTS.ASSIGNMENT_ID,
          grade: 85,
          date: expect.any(Date),
          note: undefined,
        },
      });
      expect(mockPrisma.monthlyAssignment.update).toHaveBeenCalledWith({
        where: { id: TEST_CONSTANTS.ASSIGNMENT_ID },
        data: {
          grade: 85,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should grade assignment with note', async () => {
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

      const updatedAssignment = {
        ...existingAssignment,
        grade: 90,
        updatedAt: new Date(),
      };

      mockPrisma.monthlyAssignment.findFirst.mockResolvedValue(existingAssignment);
      mockPrisma.monthlyAssignmentGradeHistory.create.mockResolvedValue({});
      mockPrisma.monthlyAssignment.update.mockResolvedValue(updatedAssignment);

      await useCase.execute(
        TEST_CONSTANTS.ASSIGNMENT_ID,
        {
          grade: 90,
          note: 'Excellent work',
        },
        TEST_CONSTANTS.STUDENT_ID
      );

      expect(mockPrisma.monthlyAssignmentGradeHistory.create).toHaveBeenCalledWith({
        data: {
          id: expect.any(String),
          monthlyAssignmentId: TEST_CONSTANTS.ASSIGNMENT_ID,
          grade: 90,
          date: expect.any(Date),
          note: 'Excellent work',
        },
      });
    });

    it('should allow grade of 0', async () => {
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

      const updatedAssignment = {
        ...existingAssignment,
        grade: 0,
        updatedAt: new Date(),
      };

      mockPrisma.monthlyAssignment.findFirst.mockResolvedValue(existingAssignment);
      mockPrisma.monthlyAssignmentGradeHistory.create.mockResolvedValue({});
      mockPrisma.monthlyAssignment.update.mockResolvedValue(updatedAssignment);

      const result = await useCase.execute(
        TEST_CONSTANTS.ASSIGNMENT_ID,
        {
          grade: 0,
        },
        TEST_CONSTANTS.STUDENT_ID
      );

      expect(result.grade).toBe(0);
    });

    it('should allow grade of 100', async () => {
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

      const updatedAssignment = {
        ...existingAssignment,
        grade: 100,
        updatedAt: new Date(),
      };

      mockPrisma.monthlyAssignment.findFirst.mockResolvedValue(existingAssignment);
      mockPrisma.monthlyAssignmentGradeHistory.create.mockResolvedValue({});
      mockPrisma.monthlyAssignment.update.mockResolvedValue(updatedAssignment);

      const result = await useCase.execute(
        TEST_CONSTANTS.ASSIGNMENT_ID,
        {
          grade: 100,
        },
        TEST_CONSTANTS.STUDENT_ID
      );

      expect(result.grade).toBe(100);
    });

    it('should throw error when grade is less than 0', async () => {
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

      await expect(
        useCase.execute(
          TEST_CONSTANTS.ASSIGNMENT_ID,
          {
            grade: -1,
          },
          TEST_CONSTANTS.STUDENT_ID
        )
      ).rejects.toThrow('La calificación debe estar entre 0 y 100');
    });

    it('should throw error when grade is greater than 100', async () => {
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

      await expect(
        useCase.execute(
          TEST_CONSTANTS.ASSIGNMENT_ID,
          {
            grade: 101,
          },
          TEST_CONSTANTS.STUDENT_ID
        )
      ).rejects.toThrow('La calificación debe estar entre 0 y 100');
    });

    it('should throw error when assignment not found', async () => {
      mockPrisma.monthlyAssignment.findFirst.mockResolvedValue(null);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.ASSIGNMENT_ID,
          {
            grade: 85,
          },
          TEST_CONSTANTS.STUDENT_ID
        )
      ).rejects.toThrow('Asignación no encontrada');
    });

    it('should throw error when assignment belongs to different student', async () => {
      mockPrisma.monthlyAssignment.findFirst.mockResolvedValue(null);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.ASSIGNMENT_ID,
          {
            grade: 85,
          },
          'different-student-id'
        )
      ).rejects.toThrow('Asignación no encontrada');
    });

    it('should update existing grade', async () => {
      const existingAssignment = {
        id: TEST_CONSTANTS.ASSIGNMENT_ID,
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        name: 'Math Assignment',
        quarter: 'Q1',
        grade: 75,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const updatedAssignment = {
        ...existingAssignment,
        grade: 90,
        updatedAt: new Date(),
      };

      mockPrisma.monthlyAssignment.findFirst.mockResolvedValue(existingAssignment);
      mockPrisma.monthlyAssignmentGradeHistory.create.mockResolvedValue({});
      mockPrisma.monthlyAssignment.update.mockResolvedValue(updatedAssignment);

      const result = await useCase.execute(
        TEST_CONSTANTS.ASSIGNMENT_ID,
        {
          grade: 90,
        },
        TEST_CONSTANTS.STUDENT_ID
      );

      expect(result.grade).toBe(90);
      expect(mockPrisma.monthlyAssignmentGradeHistory.create).toHaveBeenCalled();
    });
  });
});

