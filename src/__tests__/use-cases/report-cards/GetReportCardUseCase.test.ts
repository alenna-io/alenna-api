import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetReportCardUseCase } from '../../../core/app/use-cases/report-cards/GetReportCardUseCase';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      projection: {
        findFirst: vi.fn(),
      },
      schoolYear: {
        findFirst: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      projectionPace: {
        findMany: vi.fn(),
      },
      monthlyAssignment: {
        findMany: vi.fn(),
      },
      schoolMonthlyAssignmentTemplate: {
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

describe('GetReportCardUseCase', () => {
  let useCase: GetReportCardUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    useCase = new GetReportCardUseCase();
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should generate report card successfully', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        deletedAt: null,
        student: {
          id: TEST_CONSTANTS.STUDENT_ID,
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          user: {
            firstName: 'John',
            lastName: 'Doe',
          },
          school: {
            id: TEST_CONSTANTS.SCHOOL_ID,
          },
        },
        projectionCategories: [],
      };

      const schoolYear = {
        id: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: '2024-2025',
        deletedAt: null,
        quarterGradePercentages: [],
      };

      mockPrisma.projection.findFirst.mockResolvedValue(projection);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.projectionPace.findMany.mockResolvedValue([]);
      mockPrisma.monthlyAssignment.findMany.mockResolvedValue([]);
      mockPrisma.schoolMonthlyAssignmentTemplate.findMany.mockResolvedValue([]);

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        TEST_CONSTANTS.STUDENT_ID
      );

      expect(result.projectionId).toBe(TEST_CONSTANTS.PROJECTION_ID);
      expect(result.studentId).toBe(TEST_CONSTANTS.STUDENT_ID);
      expect(result.studentName).toBe('John Doe');
      expect(result.schoolYear).toBe('2024-2025');
      expect(result.quarters.Q1).toBeDefined();
      expect(result.quarters.Q2).toBeDefined();
      expect(result.quarters.Q3).toBeDefined();
      expect(result.quarters.Q4).toBeDefined();
    });

    it('should throw error when projection not found', async () => {
      mockPrisma.projection.findFirst.mockResolvedValue(null);

      await expect(
        useCase.execute(TEST_CONSTANTS.PROJECTION_ID, TEST_CONSTANTS.STUDENT_ID)
      ).rejects.toThrow('Proyección no encontrada');
    });

    it('should throw error when projection belongs to different student', async () => {
      mockPrisma.projection.findFirst.mockResolvedValue(null);

      await expect(
        useCase.execute(TEST_CONSTANTS.PROJECTION_ID, 'different-student-id')
      ).rejects.toThrow('Proyección no encontrada');
    });

    it('should throw error when school year not found', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        deletedAt: null,
        student: {
          id: TEST_CONSTANTS.STUDENT_ID,
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          user: {
            firstName: 'John',
            lastName: 'Doe',
          },
          school: {
            id: TEST_CONSTANTS.SCHOOL_ID,
          },
        },
        projectionCategories: [],
      };

      mockPrisma.projection.findFirst.mockResolvedValue(projection);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(null);

      await expect(
        useCase.execute(TEST_CONSTANTS.PROJECTION_ID, TEST_CONSTANTS.STUDENT_ID)
      ).rejects.toThrow('Año escolar no encontrado');
    });

    it('should allow parent to view their child report card', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        deletedAt: null,
        student: {
          id: TEST_CONSTANTS.STUDENT_ID,
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          user: {
            firstName: 'John',
            lastName: 'Doe',
          },
          school: {
            id: TEST_CONSTANTS.SCHOOL_ID,
          },
        },
        projectionCategories: [],
      };

      const schoolYear = {
        id: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: '2024-2025',
        deletedAt: null,
        quarterGradePercentages: [],
      };

      const parentUser = {
        id: 'parent-user-id',
        deletedAt: null,
        userRoles: [
          { role: { name: 'PARENT' } },
        ],
        userStudents: [
          { studentId: TEST_CONSTANTS.STUDENT_ID },
        ],
        student: null,
      };

      mockPrisma.projection.findFirst.mockResolvedValue(projection);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.user.findUnique.mockResolvedValue(parentUser);
      mockPrisma.projectionPace.findMany.mockResolvedValue([]);
      mockPrisma.monthlyAssignment.findMany.mockResolvedValue([]);
      mockPrisma.schoolMonthlyAssignmentTemplate.findMany.mockResolvedValue([]);

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        TEST_CONSTANTS.STUDENT_ID,
        'parent-user-id'
      );

      expect(result).toBeDefined();
    });

    it('should throw error when parent tries to view unrelated student report card', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        deletedAt: null,
        student: {
          id: TEST_CONSTANTS.STUDENT_ID,
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          user: {
            firstName: 'John',
            lastName: 'Doe',
          },
          school: {
            id: TEST_CONSTANTS.SCHOOL_ID,
          },
        },
        projectionCategories: [],
      };

      const schoolYear = {
        id: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: '2024-2025',
        deletedAt: null,
        quarterGradePercentages: [],
      };

      const parentUser = {
        id: 'parent-user-id',
        deletedAt: null,
        userRoles: [
          { role: { name: 'PARENT' } },
        ],
        userStudents: [
          { studentId: 'different-student-id' },
        ],
        student: null,
      };

      mockPrisma.projection.findFirst.mockResolvedValue(projection);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.user.findUnique.mockResolvedValue(parentUser);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.PROJECTION_ID,
          TEST_CONSTANTS.STUDENT_ID,
          'parent-user-id'
        )
      ).rejects.toThrow('No tienes permiso para ver la boleta de este estudiante');
    });

    it('should allow student to view their own report card', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        deletedAt: null,
        student: {
          id: TEST_CONSTANTS.STUDENT_ID,
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          user: {
            firstName: 'John',
            lastName: 'Doe',
          },
          school: {
            id: TEST_CONSTANTS.SCHOOL_ID,
          },
        },
        projectionCategories: [],
      };

      const schoolYear = {
        id: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: '2024-2025',
        deletedAt: null,
        quarterGradePercentages: [],
      };

      const studentUser = {
        id: 'student-user-id',
        deletedAt: null,
        userRoles: [
          { role: { name: 'STUDENT' } },
        ],
        userStudents: [],
        student: {
          id: TEST_CONSTANTS.STUDENT_ID,
        },
      };

      mockPrisma.projection.findFirst.mockResolvedValue(projection);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.user.findUnique.mockResolvedValue(studentUser);
      mockPrisma.projectionPace.findMany.mockResolvedValue([]);
      mockPrisma.monthlyAssignment.findMany.mockResolvedValue([]);
      mockPrisma.schoolMonthlyAssignmentTemplate.findMany.mockResolvedValue([]);

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        TEST_CONSTANTS.STUDENT_ID,
        'student-user-id'
      );

      expect(result).toBeDefined();
    });

    it('should throw error when student tries to view another student report card', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        deletedAt: null,
        student: {
          id: TEST_CONSTANTS.STUDENT_ID,
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          user: {
            firstName: 'John',
            lastName: 'Doe',
          },
          school: {
            id: TEST_CONSTANTS.SCHOOL_ID,
          },
        },
        projectionCategories: [],
      };

      const schoolYear = {
        id: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: '2024-2025',
        deletedAt: null,
        quarterGradePercentages: [],
      };

      const studentUser = {
        id: 'student-user-id',
        deletedAt: null,
        userRoles: [
          { role: { name: 'STUDENT' } },
        ],
        userStudents: [],
        student: {
          id: 'different-student-id',
        },
      };

      mockPrisma.projection.findFirst.mockResolvedValue(projection);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.user.findUnique.mockResolvedValue(studentUser);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.PROJECTION_ID,
          TEST_CONSTANTS.STUDENT_ID,
          'student-user-id'
        )
      ).rejects.toThrow('No tienes permiso para ver la boleta de este estudiante');
    });

    it('should allow teacher to view any student report card', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        deletedAt: null,
        student: {
          id: TEST_CONSTANTS.STUDENT_ID,
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          user: {
            firstName: 'John',
            lastName: 'Doe',
          },
          school: {
            id: TEST_CONSTANTS.SCHOOL_ID,
          },
        },
        projectionCategories: [],
      };

      const schoolYear = {
        id: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: '2024-2025',
        deletedAt: null,
        quarterGradePercentages: [],
      };

      const teacherUser = {
        id: 'teacher-user-id',
        deletedAt: null,
        userRoles: [
          { role: { name: 'TEACHER' } },
        ],
        userStudents: [],
        student: null,
      };

      mockPrisma.projection.findFirst.mockResolvedValue(projection);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.user.findUnique.mockResolvedValue(teacherUser);
      mockPrisma.projectionPace.findMany.mockResolvedValue([]);
      mockPrisma.monthlyAssignment.findMany.mockResolvedValue([]);
      mockPrisma.schoolMonthlyAssignmentTemplate.findMany.mockResolvedValue([]);

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        TEST_CONSTANTS.STUDENT_ID,
        'teacher-user-id'
      );

      expect(result).toBeDefined();
    });

    it('should calculate subject averages correctly', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        deletedAt: null,
        student: {
          id: TEST_CONSTANTS.STUDENT_ID,
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          user: {
            firstName: 'John',
            lastName: 'Doe',
          },
          school: {
            id: TEST_CONSTANTS.SCHOOL_ID,
          },
        },
        projectionCategories: [],
      };

      const schoolYear = {
        id: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: '2024-2025',
        deletedAt: null,
        quarterGradePercentages: [],
      };

      const projectionPaces = [
        {
          id: 'pace-1',
          quarter: 'Q1',
          grade: 85,
          isCompleted: true,
          isFailed: false,
          paceCatalog: {
            code: 'MATH-001',
            subSubject: {
              category: {
                name: 'Math',
              },
            },
          },
        },
        {
          id: 'pace-2',
          quarter: 'Q1',
          grade: 90,
          isCompleted: true,
          isFailed: false,
          paceCatalog: {
            code: 'MATH-002',
            subSubject: {
              category: {
                name: 'Math',
              },
            },
          },
        },
      ];

      mockPrisma.projection.findFirst.mockResolvedValue(projection);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.projectionPace.findMany.mockResolvedValue(projectionPaces);
      mockPrisma.monthlyAssignment.findMany.mockResolvedValue([]);
      mockPrisma.schoolMonthlyAssignmentTemplate.findMany.mockResolvedValue([]);

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        TEST_CONSTANTS.STUDENT_ID
      );

      const q1Data = result.quarters.Q1;
      expect(q1Data.subjects.length).toBeGreaterThan(0);
      const mathSubject = q1Data.subjects.find(s => s.subject === 'Math');
      expect(mathSubject).toBeDefined();
      expect(mathSubject?.average).toBe(87.5);
    });

    it('should calculate monthly assignment average correctly', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        deletedAt: null,
        student: {
          id: TEST_CONSTANTS.STUDENT_ID,
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          user: {
            firstName: 'John',
            lastName: 'Doe',
          },
          school: {
            id: TEST_CONSTANTS.SCHOOL_ID,
          },
        },
        projectionCategories: [],
      };

      const schoolYear = {
        id: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: '2024-2025',
        deletedAt: null,
        quarterGradePercentages: [
          { quarter: 'Q1', percentage: 30 },
        ],
      };

      const monthlyAssignments = [
        {
          id: 'ma-1',
          name: 'Math Test',
          quarter: 'Q1',
          grade: 85,
        },
        {
          id: 'ma-2',
          name: 'Science Test',
          quarter: 'Q1',
          grade: 90,
        },
      ];

      const templates = [
        {
          id: 'template-1',
          name: 'Math Test',
          quarter: 'Q1',
        },
        {
          id: 'template-2',
          name: 'Science Test',
          quarter: 'Q1',
        },
      ];

      mockPrisma.projection.findFirst.mockResolvedValue(projection);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.projectionPace.findMany.mockResolvedValue([]);
      mockPrisma.monthlyAssignment.findMany.mockResolvedValue(monthlyAssignments);
      mockPrisma.schoolMonthlyAssignmentTemplate.findMany.mockResolvedValue(templates);

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        TEST_CONSTANTS.STUDENT_ID
      );

      const q1Data = result.quarters.Q1;
      expect(q1Data.monthlyAssignmentAverage).toBe(87.5);
      expect(q1Data.monthlyAssignmentPercentage).toBe(30);
      expect(q1Data.pacePercentage).toBe(70);
    });

    it('should calculate final grade correctly with percentages', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        deletedAt: null,
        student: {
          id: TEST_CONSTANTS.STUDENT_ID,
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          user: {
            firstName: 'John',
            lastName: 'Doe',
          },
          school: {
            id: TEST_CONSTANTS.SCHOOL_ID,
          },
        },
        projectionCategories: [],
      };

      const schoolYear = {
        id: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: '2024-2025',
        deletedAt: null,
        quarterGradePercentages: [
          { quarter: 'Q1', percentage: 30 },
        ],
      };

      const projectionPaces = [
        {
          id: 'pace-1',
          quarter: 'Q1',
          grade: 85,
          isCompleted: true,
          isFailed: false,
          paceCatalog: {
            code: 'MATH-001',
            subSubject: {
              category: {
                name: 'Math',
              },
            },
          },
        },
      ];

      const monthlyAssignments = [
        {
          id: 'ma-1',
          name: 'Math Test',
          quarter: 'Q1',
          grade: 90,
        },
      ];

      const templates = [
        {
          id: 'template-1',
          name: 'Math Test',
          quarter: 'Q1',
        },
      ];

      mockPrisma.projection.findFirst.mockResolvedValue(projection);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.projectionPace.findMany.mockResolvedValue(projectionPaces);
      mockPrisma.monthlyAssignment.findMany.mockResolvedValue(monthlyAssignments);
      mockPrisma.schoolMonthlyAssignmentTemplate.findMany.mockResolvedValue(templates);

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        TEST_CONSTANTS.STUDENT_ID
      );

      const q1Data = result.quarters.Q1;
      expect(q1Data.finalGrade).toBeDefined();
      expect(q1Data.finalGrade).toBeCloseTo((0.3 * 90) + (0.7 * 85), 2);
    });

    it('should count passed PACEs correctly', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        deletedAt: null,
        student: {
          id: TEST_CONSTANTS.STUDENT_ID,
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          user: {
            firstName: 'John',
            lastName: 'Doe',
          },
          school: {
            id: TEST_CONSTANTS.SCHOOL_ID,
          },
        },
        projectionCategories: [],
      };

      const schoolYear = {
        id: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: '2024-2025',
        deletedAt: null,
        quarterGradePercentages: [],
      };

      const projectionPaces = [
        {
          id: 'pace-1',
          quarter: 'Q1',
          grade: 85,
          isCompleted: true,
          isFailed: false,
          paceCatalog: {
            code: 'MATH-001',
            subSubject: {
              category: {
                name: 'Math',
              },
            },
          },
        },
        {
          id: 'pace-2',
          quarter: 'Q1',
          grade: 75,
          isCompleted: true,
          isFailed: false,
          paceCatalog: {
            code: 'MATH-002',
            subSubject: {
              category: {
                name: 'Math',
              },
            },
          },
        },
        {
          id: 'pace-3',
          quarter: 'Q1',
          grade: 90,
          isCompleted: false,
          isFailed: false,
          paceCatalog: {
            code: 'MATH-003',
            subSubject: {
              category: {
                name: 'Math',
              },
            },
          },
        },
      ];

      mockPrisma.projection.findFirst.mockResolvedValue(projection);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.projectionPace.findMany.mockResolvedValue(projectionPaces);
      mockPrisma.monthlyAssignment.findMany.mockResolvedValue([]);
      mockPrisma.schoolMonthlyAssignmentTemplate.findMany.mockResolvedValue([]);

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        TEST_CONSTANTS.STUDENT_ID
      );

      const q1Data = result.quarters.Q1;
      const mathSubject = q1Data.subjects.find(s => s.subject === 'Math');
      expect(mathSubject?.passedCount).toBe(1);
      expect(q1Data.totalPassedPaces).toBe(1);
    });

    it('should determine academic projection completion correctly', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        deletedAt: null,
        student: {
          id: TEST_CONSTANTS.STUDENT_ID,
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          user: {
            firstName: 'John',
            lastName: 'Doe',
          },
          school: {
            id: TEST_CONSTANTS.SCHOOL_ID,
          },
        },
        projectionCategories: [],
      };

      const schoolYear = {
        id: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: '2024-2025',
        deletedAt: null,
        quarterGradePercentages: [],
      };

      const projectionPaces = [
        {
          id: 'pace-1',
          quarter: 'Q1',
          grade: 85,
          isCompleted: true,
          isFailed: false,
          paceCatalog: {
            code: 'MATH-001',
            subSubject: {
              category: {
                name: 'Math',
              },
            },
          },
        },
        {
          id: 'pace-2',
          quarter: 'Q1',
          grade: 90,
          isCompleted: true,
          isFailed: false,
          paceCatalog: {
            code: 'MATH-002',
            subSubject: {
              category: {
                name: 'Math',
              },
            },
          },
        },
      ];

      mockPrisma.projection.findFirst.mockResolvedValue(projection);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.projectionPace.findMany.mockResolvedValue(projectionPaces);
      mockPrisma.monthlyAssignment.findMany.mockResolvedValue([]);
      mockPrisma.schoolMonthlyAssignmentTemplate.findMany.mockResolvedValue([]);

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        TEST_CONSTANTS.STUDENT_ID
      );

      const q1Data = result.quarters.Q1;
      expect(q1Data.academicProjectionCompleted).toBe(true);
    });

    it('should mark academic projection as incomplete when PACE is not completed', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        deletedAt: null,
        student: {
          id: TEST_CONSTANTS.STUDENT_ID,
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          user: {
            firstName: 'John',
            lastName: 'Doe',
          },
          school: {
            id: TEST_CONSTANTS.SCHOOL_ID,
          },
        },
        projectionCategories: [],
      };

      const schoolYear = {
        id: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: '2024-2025',
        deletedAt: null,
        quarterGradePercentages: [],
      };

      const projectionPaces = [
        {
          id: 'pace-1',
          quarter: 'Q1',
          grade: 85,
          isCompleted: true,
          isFailed: false,
          paceCatalog: {
            code: 'MATH-001',
            subSubject: {
              category: {
                name: 'Math',
              },
            },
          },
        },
        {
          id: 'pace-2',
          quarter: 'Q1',
          grade: 90,
          isCompleted: false,
          isFailed: false,
          paceCatalog: {
            code: 'MATH-002',
            subSubject: {
              category: {
                name: 'Math',
              },
            },
          },
        },
      ];

      mockPrisma.projection.findFirst.mockResolvedValue(projection);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.projectionPace.findMany.mockResolvedValue(projectionPaces);
      mockPrisma.monthlyAssignment.findMany.mockResolvedValue([]);
      mockPrisma.schoolMonthlyAssignmentTemplate.findMany.mockResolvedValue([]);

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        TEST_CONSTANTS.STUDENT_ID
      );

      const q1Data = result.quarters.Q1;
      expect(q1Data.academicProjectionCompleted).toBe(false);
    });

    it('should handle missing student name gracefully', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        deletedAt: null,
        student: {
          id: TEST_CONSTANTS.STUDENT_ID,
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          user: null,
          school: {
            id: TEST_CONSTANTS.SCHOOL_ID,
          },
        },
        projectionCategories: [],
      };

      const schoolYear = {
        id: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: '2024-2025',
        deletedAt: null,
        quarterGradePercentages: [],
      };

      mockPrisma.projection.findFirst.mockResolvedValue(projection);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.projectionPace.findMany.mockResolvedValue([]);
      mockPrisma.monthlyAssignment.findMany.mockResolvedValue([]);
      mockPrisma.schoolMonthlyAssignmentTemplate.findMany.mockResolvedValue([]);

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        TEST_CONSTANTS.STUDENT_ID
      );

      expect(result.studentName).toBe('Estudiante');
    });

    it('should use default percentage of 0 when no quarter grade percentage set', async () => {
      const projection = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        deletedAt: null,
        student: {
          id: TEST_CONSTANTS.STUDENT_ID,
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          user: {
            firstName: 'John',
            lastName: 'Doe',
          },
          school: {
            id: TEST_CONSTANTS.SCHOOL_ID,
          },
        },
        projectionCategories: [],
      };

      const schoolYear = {
        id: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: '2024-2025',
        deletedAt: null,
        quarterGradePercentages: [],
      };

      mockPrisma.projection.findFirst.mockResolvedValue(projection);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.projectionPace.findMany.mockResolvedValue([]);
      mockPrisma.monthlyAssignment.findMany.mockResolvedValue([]);
      mockPrisma.schoolMonthlyAssignmentTemplate.findMany.mockResolvedValue([]);

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        TEST_CONSTANTS.STUDENT_ID
      );

      const q1Data = result.quarters.Q1;
      expect(q1Data.monthlyAssignmentPercentage).toBe(0);
      expect(q1Data.pacePercentage).toBe(100);
    });
  });
});

