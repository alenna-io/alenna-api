import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateMonthlyAssignmentUseCase } from '../../../core/app/use-cases/deprecated/monthly-assignments/CreateMonthlyAssignmentUseCase';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      projection: {
        findFirst: vi.fn(),
      },
      monthlyAssignment: {
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

describe('CreateMonthlyAssignmentUseCase', () => {
  let useCase: CreateMonthlyAssignmentUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    useCase = new CreateMonthlyAssignmentUseCase();
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should create monthly assignment successfully', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        deletedAt: null,
      };

      const createdAssignment = {
        id: TEST_CONSTANTS.ASSIGNMENT_ID,
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        name: 'Math Assignment',
        quarter: 'Q1',
        grade: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrisma.projection.findFirst.mockResolvedValue(projection);
      mockPrisma.monthlyAssignment.create.mockResolvedValue(createdAssignment);

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        {
          name: 'Math Assignment',
          quarter: 'Q1',
        },
        TEST_CONSTANTS.STUDENT_ID
      );

      expect(result.id).toBe(TEST_CONSTANTS.ASSIGNMENT_ID);
      expect(result.name).toBe('Math Assignment');
      expect(result.quarter).toBe('Q1');
      expect(result.grade).toBeNull();
      expect(mockPrisma.projection.findFirst).toHaveBeenCalledWith({
        where: {
          id: TEST_CONSTANTS.PROJECTION_ID,
          studentId: TEST_CONSTANTS.STUDENT_ID,
          deletedAt: null,
        },
      });
      expect(mockPrisma.monthlyAssignment.create).toHaveBeenCalled();
    });

    it('should trim assignment name', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        deletedAt: null,
      };

      const createdAssignment = {
        id: TEST_CONSTANTS.ASSIGNMENT_ID,
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        name: 'Math Assignment',
        quarter: 'Q1',
        grade: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrisma.projection.findFirst.mockResolvedValue(projection);
      mockPrisma.monthlyAssignment.create.mockResolvedValue(createdAssignment);

      await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        {
          name: '  Math Assignment  ',
          quarter: 'Q1',
        },
        TEST_CONSTANTS.STUDENT_ID
      );

      expect(mockPrisma.monthlyAssignment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Math Assignment',
        }),
      });
    });

    it('should throw error when projection not found', async () => {
      mockPrisma.projection.findFirst.mockResolvedValue(null);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.PROJECTION_ID,
          {
            name: 'Math Assignment',
            quarter: 'Q1',
          },
          TEST_CONSTANTS.STUDENT_ID
        )
      ).rejects.toThrow('Proyección no encontrada');
    });

    it('should throw error when projection belongs to different student', async () => {
      mockPrisma.projection.findFirst.mockResolvedValue(null);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.PROJECTION_ID,
          {
            name: 'Math Assignment',
            quarter: 'Q1',
          },
          'different-student-id'
        )
      ).rejects.toThrow('Proyección no encontrada');
    });

    it('should throw error for invalid quarter', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        deletedAt: null,
      };

      mockPrisma.projection.findFirst.mockResolvedValue(projection);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.PROJECTION_ID,
          {
            name: 'Math Assignment',
            quarter: 'Q5',
          },
          TEST_CONSTANTS.STUDENT_ID
        )
      ).rejects.toThrow('Trimestre inválido');
    });

    it('should accept all valid quarters', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        deletedAt: null,
      };

      const createdAssignment = {
        id: TEST_CONSTANTS.ASSIGNMENT_ID,
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        name: 'Math Assignment',
        quarter: 'Q2',
        grade: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrisma.projection.findFirst.mockResolvedValue(projection);
      mockPrisma.monthlyAssignment.create.mockResolvedValue(createdAssignment);

      for (const quarter of ['Q1', 'Q2', 'Q3', 'Q4']) {
        await useCase.execute(
          TEST_CONSTANTS.PROJECTION_ID,
          {
            name: `Assignment ${quarter}`,
            quarter,
          },
          TEST_CONSTANTS.STUDENT_ID
        );
      }

      expect(mockPrisma.monthlyAssignment.create).toHaveBeenCalledTimes(4);
    });

    it('should throw error when name is empty', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        deletedAt: null,
      };

      mockPrisma.projection.findFirst.mockResolvedValue(projection);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.PROJECTION_ID,
          {
            name: '',
            quarter: 'Q1',
          },
          TEST_CONSTANTS.STUDENT_ID
        )
      ).rejects.toThrow('El nombre de la asignación es requerido');
    });

    it('should throw error when name is only whitespace', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        deletedAt: null,
      };

      mockPrisma.projection.findFirst.mockResolvedValue(projection);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.PROJECTION_ID,
          {
            name: '   ',
            quarter: 'Q1',
          },
          TEST_CONSTANTS.STUDENT_ID
        )
      ).rejects.toThrow('El nombre de la asignación es requerido');
    });
  });
});

