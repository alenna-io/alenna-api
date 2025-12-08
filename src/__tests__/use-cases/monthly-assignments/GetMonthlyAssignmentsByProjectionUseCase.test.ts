import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetMonthlyAssignmentsByProjectionUseCase } from '../../../core/app/use-cases/monthly-assignments/GetMonthlyAssignmentsByProjectionUseCase';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      projection: {
        findFirst: vi.fn(),
      },
      monthlyAssignment: {
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

describe('GetMonthlyAssignmentsByProjectionUseCase', () => {
  let useCase: GetMonthlyAssignmentsByProjectionUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    useCase = new GetMonthlyAssignmentsByProjectionUseCase();
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return assignments for projection', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        deletedAt: null,
      };

      const assignments = [
        {
          id: 'assignment-1',
          name: 'Math Assignment',
          quarter: 'Q1',
          grade: 85,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
          gradeHistory: [
            {
              id: 'history-1',
              grade: 85,
              date: new Date('2024-01-02'),
              note: 'First attempt',
            },
          ],
        },
        {
          id: 'assignment-2',
          name: 'Science Assignment',
          quarter: 'Q1',
          grade: null,
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-03'),
          gradeHistory: [],
        },
      ];

      mockPrisma.projection.findFirst.mockResolvedValue(projection);
      mockPrisma.monthlyAssignment.findMany.mockResolvedValue(assignments);

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        TEST_CONSTANTS.STUDENT_ID
      );

      expect(result.length).toBe(2);
      expect(result[0].id).toBe('assignment-1');
      expect(result[0].name).toBe('Math Assignment');
      expect(result[0].grade).toBe(85);
      expect(result[0].gradeHistory.length).toBe(1);
      expect(result[0].gradeHistory[0].grade).toBe(85);
      expect(result[0].gradeHistory[0].note).toBe('First attempt');
      expect(result[1].id).toBe('assignment-2');
      expect(result[1].grade).toBeNull();
      expect(result[1].gradeHistory.length).toBe(0);
    });

    it('should return empty array when no assignments exist', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        deletedAt: null,
      };

      mockPrisma.projection.findFirst.mockResolvedValue(projection);
      mockPrisma.monthlyAssignment.findMany.mockResolvedValue([]);

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        TEST_CONSTANTS.STUDENT_ID
      );

      expect(result).toEqual([]);
    });

    it('should throw error when projection not found', async () => {
      mockPrisma.projection.findFirst.mockResolvedValue(null);

      await expect(
        useCase.execute(TEST_CONSTANTS.PROJECTION_ID, TEST_CONSTANTS.STUDENT_ID)
      ).rejects.toThrow('Proyección no encontrada');
    });

    it('should order assignments by quarter and name', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        deletedAt: null,
      };

      const assignments = [
        {
          id: 'assignment-1',
          name: 'B Assignment',
          quarter: 'Q1',
          grade: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          gradeHistory: [],
        },
        {
          id: 'assignment-2',
          name: 'A Assignment',
          quarter: 'Q1',
          grade: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          gradeHistory: [],
        },
        {
          id: 'assignment-3',
          name: 'C Assignment',
          quarter: 'Q2',
          grade: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          gradeHistory: [],
        },
      ];

      mockPrisma.projection.findFirst.mockResolvedValue(projection);
      mockPrisma.monthlyAssignment.findMany.mockResolvedValue(assignments);

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        TEST_CONSTANTS.STUDENT_ID
      );

      expect(mockPrisma.monthlyAssignment.findMany).toHaveBeenCalledWith({
        where: {
          projectionId: TEST_CONSTANTS.PROJECTION_ID,
          deletedAt: null,
        },
        include: {
          gradeHistory: {
            orderBy: {
              date: 'asc',
            },
          },
        },
        orderBy: [
          { quarter: 'asc' },
          { name: 'asc' },
        ],
      });
    });

    it('should include grade history ordered by date', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        deletedAt: null,
      };

      const assignments = [
        {
          id: 'assignment-1',
          name: 'Math Assignment',
          quarter: 'Q1',
          grade: 90,
          createdAt: new Date(),
          updatedAt: new Date(),
          gradeHistory: [
            {
              id: 'history-1',
              grade: 75,
              date: new Date('2024-01-01'),
              note: 'First attempt',
            },
            {
              id: 'history-2',
              grade: 90,
              date: new Date('2024-01-02'),
              note: 'Second attempt',
            },
          ],
        },
      ];

      mockPrisma.projection.findFirst.mockResolvedValue(projection);
      mockPrisma.monthlyAssignment.findMany.mockResolvedValue(assignments);

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        TEST_CONSTANTS.STUDENT_ID
      );

      expect(result[0].gradeHistory.length).toBe(2);
      expect(result[0].gradeHistory[0].grade).toBe(75);
      expect(result[0].gradeHistory[1].grade).toBe(90);
    });
  });
});

