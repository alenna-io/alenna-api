import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateProjectionFromDefaultTemplateUseCase } from '../../../core/app/use-cases/projections/GenerateProjectionFromDefaultTemplateUseCase';
import { createMockProjectionRepository } from '../../utils/mockRepositories';
import { Projection } from '../../../core/domain/entities';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      projectionTemplate: {
        findUnique: vi.fn(),
      },
      paceCatalog: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
      },
      subSubject: {
        findUnique: vi.fn(),
      },
      projectionPace: {
        findUnique: vi.fn(),
        createMany: vi.fn(),
      },
      projectionCategory: {
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

describe('GenerateProjectionFromDefaultTemplateUseCase', () => {
  let useCase: GenerateProjectionFromDefaultTemplateUseCase;
  let mockRepository: ReturnType<typeof createMockProjectionRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    mockRepository = createMockProjectionRepository();
    useCase = new GenerateProjectionFromDefaultTemplateUseCase(mockRepository);
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('execute', () => {
    it('should generate projection from default template successfully', async () => {
      const template = {
        id: 'template-1',
        isDefault: true,
        templateSubjects: [
          {
            subSubjectId: 'math-1',
            startPace: 1001,
            endPace: 1012,
            skipPaces: [],
            subSubject: {
              id: 'math-1',
              name: 'Math',
            },
          },
          {
            subSubjectId: 'english-1',
            startPace: 2001,
            endPace: 2012,
            skipPaces: [],
            subSubject: {
              id: 'english-1',
              name: 'English',
            },
          },
        ],
      };

      const createdProjection = Projection.create({
        id: 'projection-1',
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date(),
        endDate: new Date(),
      });

      const paceCatalog = {
        id: 'pace-catalog-1',
        code: '1001',
        subSubject: {
          category: {
            id: 'category-1',
          },
        },
      };

      vi.mocked(mockRepository.findActiveByStudentId).mockResolvedValue(null);
      vi.mocked(mockRepository.findByStudentIdAndSchoolYear).mockResolvedValue(null);
      mockPrisma.projectionTemplate.findUnique.mockResolvedValue(template);
      vi.mocked(mockRepository.create).mockResolvedValue(createdProjection);
      mockPrisma.paceCatalog.findFirst.mockResolvedValue(paceCatalog);
      mockPrisma.paceCatalog.findUnique.mockResolvedValue(paceCatalog);
      mockPrisma.projectionPace.findUnique.mockResolvedValue(null);
      mockPrisma.projectionPace.createMany.mockResolvedValue({ count: 24 });
      mockPrisma.projectionCategory.createMany.mockResolvedValue({ count: 1 });

      const result = await useCase.execute({
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        templateId: 'template-1',
      });

      expect(result.id).toBe('projection-1');
      expect(mockPrisma.projectionTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: 'template-1' },
        include: {
          templateSubjects: {
            include: {
              subSubject: true,
            },
          },
        },
      });
    });

    it('should throw error when template not found', async () => {
      vi.mocked(mockRepository.findActiveByStudentId).mockResolvedValue(null);
      vi.mocked(mockRepository.findByStudentIdAndSchoolYear).mockResolvedValue(null);
      mockPrisma.projectionTemplate.findUnique.mockResolvedValue(null);

      await expect(
        useCase.execute({
          studentId: TEST_CONSTANTS.STUDENT_ID,
          schoolYear: '2024-2025',
          templateId: 'template-1',
        })
      ).rejects.toThrow('Plantilla no encontrada');
    });

    it('should throw error when template is not default', async () => {
      const template = {
        id: 'template-1',
        isDefault: false,
        templateSubjects: [],
      };

      vi.mocked(mockRepository.findActiveByStudentId).mockResolvedValue(null);
      vi.mocked(mockRepository.findByStudentIdAndSchoolYear).mockResolvedValue(null);
      mockPrisma.projectionTemplate.findUnique.mockResolvedValue(template);

      await expect(
        useCase.execute({
          studentId: TEST_CONSTANTS.STUDENT_ID,
          schoolYear: '2024-2025',
          templateId: 'template-1',
        })
      ).rejects.toThrow('Este endpoint solo es válido para plantillas predeterminadas');
    });

    it('should throw error when student has active projection', async () => {
      const activeProjection = Projection.create({
        id: 'projection-1',
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date(),
        endDate: new Date(),
      });

      vi.mocked(mockRepository.findActiveByStudentId).mockResolvedValue(activeProjection);

      await expect(
        useCase.execute({
          studentId: TEST_CONSTANTS.STUDENT_ID,
          schoolYear: '2024-2025',
          templateId: 'template-1',
        })
      ).rejects.toThrow('El estudiante ya tiene una proyección activa');
    });

    it('should use default template algorithm', async () => {
      const template = {
        id: 'template-1',
        isDefault: true,
        templateSubjects: [
          {
            subSubjectId: 'math-1',
            startPace: 1001,
            endPace: 1003,
            skipPaces: [],
            subSubject: {
              id: 'math-1',
              name: 'Math',
            },
          },
        ],
      };

      const createdProjection = Projection.create({
        id: 'projection-1',
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        startDate: new Date(),
        endDate: new Date(),
      });

      const paceCatalog = {
        id: 'pace-catalog-1',
        code: '1001',
        subSubject: {
          category: {
            id: 'category-1',
          },
        },
      };

      vi.mocked(mockRepository.findActiveByStudentId).mockResolvedValue(null);
      vi.mocked(mockRepository.findByStudentIdAndSchoolYear).mockResolvedValue(null);
      mockPrisma.projectionTemplate.findUnique.mockResolvedValue(template);
      vi.mocked(mockRepository.create).mockResolvedValue(createdProjection);
      mockPrisma.paceCatalog.findFirst.mockResolvedValue(paceCatalog);
      mockPrisma.paceCatalog.findUnique.mockResolvedValue(paceCatalog);
      mockPrisma.projectionPace.findUnique.mockResolvedValue(null);
      mockPrisma.projectionPace.createMany.mockResolvedValue({ count: 3 });
      mockPrisma.projectionCategory.createMany.mockResolvedValue({ count: 1 });

      await useCase.execute({
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolYear: '2024-2025',
        templateId: 'template-1',
      });

      expect(mockPrisma.projectionPace.createMany).toHaveBeenCalled();
    });
  });
});

