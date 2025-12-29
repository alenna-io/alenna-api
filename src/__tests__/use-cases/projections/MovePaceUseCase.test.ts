import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MovePaceUseCase } from '../../../core/app/use-cases/projections/MovePaceUseCase';
import { createMockProjectionRepository } from '../../utils/mockRepositories';
import { Projection } from '../../../core/domain/entities';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      projectionPace: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      projection: {
        findFirst: vi.fn(),
      },
      quarter: {
        findFirst: vi.fn(),
      },
      schoolYear: {
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

vi.mock('../../../core/frameworks/database/mappers', () => {
  return {
    ProjectionPaceMapper: {
      toDomain: vi.fn((pace) => ({
        id: pace.id,
        projectionId: pace.projectionId,
        paceCatalogId: pace.paceCatalogId,
        quarter: pace.quarter,
        week: pace.week,
        grade: pace.grade,
        isCompleted: pace.isCompleted,
        isFailed: pace.isFailed,
        comments: pace.comments ?? undefined,
      })),
    },
  };
});

describe('MovePaceUseCase', () => {
  let useCase: MovePaceUseCase;
  let mockRepository: ReturnType<typeof createMockProjectionRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    mockRepository = createMockProjectionRepository();
    useCase = new MovePaceUseCase(mockRepository);
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should move PACE successfully', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-05-31'),
      });

      const projectionPace = {
        id: 'projection-pace-1',
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        quarter: 'Q1',
        week: 1,
        deletedAt: null,
        paceCatalog: {
          subSubject: {
            category: {
              name: 'Math',
            },
          },
        },
      };

      const updatedPace = {
        ...projectionPace,
        quarter: 'Q2',
        week: 5,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(projection);
      mockPrisma.projectionPace.findFirst
        .mockResolvedValueOnce(projectionPace)
        .mockResolvedValueOnce(null);
      mockPrisma.projectionPace.update.mockResolvedValue(updatedPace);

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        'projection-pace-1',
        TEST_CONSTANTS.STUDENT_ID,
        'Q2',
        5
      );

      expect(result.quarter).toBe('Q2');
      expect(result.week).toBe(5);
      expect(mockPrisma.projectionPace.update).toHaveBeenCalledWith({
        where: { id: 'projection-pace-1' },
        data: {
          quarter: 'Q2',
          week: 5,
        },
      });
    });

    it('should throw error when projection not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.PROJECTION_ID,
          'projection-pace-1',
          TEST_CONSTANTS.STUDENT_ID,
          'Q2',
          5
        )
      ).rejects.toThrow('Proyección no encontrada');
    });

    it('should throw error when projection pace not found', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-05-31'),
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(projection);
      mockPrisma.projectionPace.findFirst.mockResolvedValue(null);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.PROJECTION_ID,
          'projection-pace-1',
          TEST_CONSTANTS.STUDENT_ID,
          'Q2',
          5
        )
      ).rejects.toThrow('PACE no encontrado en la proyección');
    });

    it('should throw error when category conflict exists at target position', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-05-31'),
      });

      const projectionPace = {
        id: 'projection-pace-1',
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        quarter: 'Q1',
        week: 1,
        deletedAt: null,
        paceCatalog: {
          subSubject: {
            category: {
              name: 'Math',
            },
          },
        },
      };

      const existingAtPosition = {
        id: 'projection-pace-2',
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        quarter: 'Q2',
        week: 5,
        deletedAt: null,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(projection);
      mockPrisma.projectionPace.findFirst
        .mockResolvedValueOnce(projectionPace)
        .mockResolvedValueOnce(existingAtPosition);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.PROJECTION_ID,
          'projection-pace-1',
          TEST_CONSTANTS.STUDENT_ID,
          'Q2',
          5
        )
      ).rejects.toThrow('Ya existe un PACE de Math en Q2 Semana 5');
    });

    it('should throw error when trying to move pace from closed quarter', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-05-31'),
      });

      const projectionPace = {
        id: 'projection-pace-1',
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        quarter: 'Q1',
        week: 1,
        deletedAt: null,
        paceCatalog: {
          subSubject: {
            category: {
              name: 'Math',
            },
          },
        },
      };

      const projectionWithStudent = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        student: {
          schoolId: 'school-1',
        },
      };

      const schoolYear = {
        id: 'school-year-1',
        schoolId: 'school-1',
        name: '2024-2025',
        deletedAt: null,
      };

      const sourceQuarter = {
        id: 'quarter-1',
        schoolYearId: 'school-year-1',
        name: 'Q1',
        isClosed: true,
        deletedAt: null,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(projection);
      mockPrisma.projectionPace.findFirst.mockResolvedValue(projectionPace);
      mockPrisma.projection.findFirst.mockResolvedValue(projectionWithStudent);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.quarter.findFirst.mockResolvedValue(sourceQuarter);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.PROJECTION_ID,
          'projection-pace-1',
          TEST_CONSTANTS.STUDENT_ID,
          'Q2',
          5
        )
      ).rejects.toThrow('Cannot move paces from closed quarter');
    });

    it('should throw error when trying to move pace to closed quarter', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-05-31'),
      });

      const projectionPace = {
        id: 'projection-pace-1',
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        quarter: 'Q1',
        week: 1,
        deletedAt: null,
        paceCatalog: {
          subSubject: {
            category: {
              name: 'Math',
            },
          },
        },
      };

      const projectionWithStudent = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        student: {
          schoolId: 'school-1',
        },
      };

      const schoolYear = {
        id: 'school-year-1',
        schoolId: 'school-1',
        name: '2024-2025',
        deletedAt: null,
      };

      const sourceQuarter = {
        id: 'quarter-1',
        schoolYearId: 'school-year-1',
        name: 'Q1',
        isClosed: false,
        deletedAt: null,
      };

      const targetQuarter = {
        id: 'quarter-2',
        schoolYearId: 'school-year-1',
        name: 'Q2',
        isClosed: true,
        deletedAt: null,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(projection);
      mockPrisma.projectionPace.findFirst.mockResolvedValue(projectionPace);
      mockPrisma.projection.findFirst.mockResolvedValue(projectionWithStudent);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.quarter.findFirst
        .mockResolvedValueOnce(sourceQuarter)
        .mockResolvedValueOnce(targetQuarter);

      await expect(
        useCase.execute(
          TEST_CONSTANTS.PROJECTION_ID,
          'projection-pace-1',
          TEST_CONSTANTS.STUDENT_ID,
          'Q2',
          5
        )
      ).rejects.toThrow('Cannot move paces to closed quarter');
    });

    it('should allow moving pace between open quarters', async () => {
      const projection = Projection.create({
        id: TEST_CONSTANTS.PROJECTION_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-05-31'),
      });

      const projectionPace = {
        id: 'projection-pace-1',
        projectionId: TEST_CONSTANTS.PROJECTION_ID,
        quarter: 'Q1',
        week: 1,
        deletedAt: null,
        paceCatalog: {
          subSubject: {
            category: {
              name: 'Math',
            },
          },
        },
      };

      const projectionWithStudent = {
        id: TEST_CONSTANTS.PROJECTION_ID,
        student: {
          schoolId: 'school-1',
        },
      };

      const schoolYear = {
        id: 'school-year-1',
        schoolId: 'school-1',
        name: '2024-2025',
        deletedAt: null,
      };

      const sourceQuarter = {
        id: 'quarter-1',
        schoolYearId: 'school-year-1',
        name: 'Q1',
        isClosed: false,
        deletedAt: null,
      };

      const targetQuarter = {
        id: 'quarter-2',
        schoolYearId: 'school-year-1',
        name: 'Q2',
        isClosed: false,
        deletedAt: null,
      };

      const updatedPace = {
        ...projectionPace,
        quarter: 'Q2',
        week: 5,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(projection);
      mockPrisma.projectionPace.findFirst
        .mockResolvedValueOnce(projectionPace)
        .mockResolvedValueOnce(null);
      mockPrisma.projection.findFirst.mockResolvedValue(projectionWithStudent);
      mockPrisma.schoolYear.findFirst.mockResolvedValue(schoolYear);
      mockPrisma.quarter.findFirst
        .mockResolvedValueOnce(sourceQuarter)
        .mockResolvedValueOnce(targetQuarter);
      mockPrisma.projectionPace.update.mockResolvedValue(updatedPace);

      const result = await useCase.execute(
        TEST_CONSTANTS.PROJECTION_ID,
        'projection-pace-1',
        TEST_CONSTANTS.STUDENT_ID,
        'Q2',
        5
      );

      expect(result.quarter).toBe('Q2');
      expect(result.week).toBe(5);
    });
  });
});

