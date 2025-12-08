import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CreateDefaultTemplatesUseCase } from '../../../core/app/use-cases/projection-templates/CreateDefaultTemplatesUseCase';
import { createMockProjectionTemplateRepository } from '../../utils/mockRepositories';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

// Mock Prisma Client
const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      projectionTemplate: {
        findFirst: vi.fn(),
      },
      subSubject: {
        findFirst: vi.fn(),
      },
    },
  };
});

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      constructor() {
        return mockPrismaInstance;
      }
    },
  };
});

vi.mock('../../../core/frameworks/database/prisma.client', () => {
  return {
    default: mockPrismaInstance,
  };
});

describe('CreateDefaultTemplatesUseCase', () => {
  let useCase: CreateDefaultTemplatesUseCase;
  let mockRepository: ReturnType<typeof createMockProjectionTemplateRepository>;
  let mockPrisma: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    mockRepository = createMockProjectionTemplateRepository();
    useCase = new CreateDefaultTemplatesUseCase(mockRepository);
    mockPrisma = mockPrismaInstance;
    // Suppress console.warn for cleaner test output
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('execute', () => {
    it('should create all 8 default templates (L1-L8) when none exist', async () => {
      // Arrange
      const mockSubSubjects = [
        { id: 'sub-1', name: 'Math L1' },
        { id: 'sub-2', name: 'English L1' },
        { id: 'sub-3', name: 'Science L1' },
        { id: 'sub-4', name: 'Social Studies L1' },
        { id: 'sub-5', name: 'Word Building L1' },
        { id: 'sub-6', name: 'Español L1' },
      ];

      mockPrisma.projectionTemplate.findFirst.mockResolvedValue(null); // No existing templates
      mockPrisma.subSubject.findFirst
        .mockResolvedValueOnce(mockSubSubjects[0]) // Math L1
        .mockResolvedValueOnce(mockSubSubjects[1]) // English L1
        .mockResolvedValueOnce(mockSubSubjects[2]) // Science L1
        .mockResolvedValueOnce(mockSubSubjects[3]) // Social Studies L1
        .mockResolvedValueOnce(mockSubSubjects[4]) // Word Building L1
        .mockResolvedValueOnce(mockSubSubjects[5]) // Español L1
        // L2-L8 will use same pattern but with different names
        .mockResolvedValue({ id: 'sub-7', name: 'Math L2' })
        .mockResolvedValue({ id: 'sub-8', name: 'English L2' })
        .mockResolvedValue({ id: 'sub-9', name: 'Science L2' })
        .mockResolvedValue({ id: 'sub-10', name: 'Social Studies L2' })
        .mockResolvedValue({ id: 'sub-11', name: 'Word Building L2' })
        .mockResolvedValue({ id: 'sub-12', name: 'Español y Ortografía L2' });

      vi.mocked(mockRepository.create).mockResolvedValue({
        id: 'template-1',
        name: 'Plantilla L1',
        level: 'L1',
        isDefault: true,
        isActive: true,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        templateSubjects: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      // Should create 8 templates (L1-L8)
      expect(mockRepository.create).toHaveBeenCalledTimes(8);
      expect(mockPrisma.projectionTemplate.findFirst).toHaveBeenCalledTimes(8);
    });

    it('should skip creating template if it already exists', async () => {
      // Arrange
      const existingTemplate = {
        id: 'template-1',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        level: 'L1',
        isDefault: true,
      };

      mockPrisma.projectionTemplate.findFirst
        .mockResolvedValueOnce(existingTemplate) // L1 exists
        .mockResolvedValueOnce(null) // L2 doesn't exist
        .mockResolvedValueOnce(null) // L3 doesn't exist
        .mockResolvedValueOnce(null) // L4 doesn't exist
        .mockResolvedValueOnce(null) // L5 doesn't exist
        .mockResolvedValueOnce(null) // L6 doesn't exist
        .mockResolvedValueOnce(null) // L7 doesn't exist
        .mockResolvedValueOnce(null); // L8 doesn't exist

      mockPrisma.subSubject.findFirst.mockResolvedValue({
        id: 'sub-1',
        name: 'Math L2',
      });

      vi.mocked(mockRepository.create).mockResolvedValue({
        id: 'template-2',
        name: 'Plantilla L2',
        level: 'L2',
        isDefault: true,
        isActive: true,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        templateSubjects: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      // Should only create 7 templates (L2-L8), skipping L1
      expect(mockRepository.create).toHaveBeenCalledTimes(7);
    });

    it('should use correct pace ranges for each level', async () => {
      // Arrange
      // L1: 1001-1012, L2: 1013-1024, L3: 1025-1036, etc.
      mockPrisma.projectionTemplate.findFirst.mockResolvedValue(null);
      mockPrisma.subSubject.findFirst.mockResolvedValue({
        id: 'sub-1',
        name: 'Math L1',
      });

      vi.mocked(mockRepository.create).mockImplementation(async (template) => {
        // Verify pace ranges
        if (template.level === 'L1') {
          expect(template.templateSubjects[0].startPace).toBe(1001);
          expect(template.templateSubjects[0].endPace).toBe(1012);
        } else if (template.level === 'L2') {
          expect(template.templateSubjects[0].startPace).toBe(1013);
          expect(template.templateSubjects[0].endPace).toBe(1024);
        } else if (template.level === 'L3') {
          expect(template.templateSubjects[0].startPace).toBe(1025);
          expect(template.templateSubjects[0].endPace).toBe(1036);
        }
        return {
          id: 'template-1',
          ...template,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      // Act
      await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledTimes(8);
    });

    it('should use "Español L1" for L1 and "Español y Ortografía" for L2-L8', async () => {
      // Arrange
      mockPrisma.projectionTemplate.findFirst.mockResolvedValue(null);
      
      // Mock all subjects for L1
      mockPrisma.subSubject.findFirst
        .mockResolvedValueOnce({ id: 'sub-1', name: 'Math L1' })
        .mockResolvedValueOnce({ id: 'sub-2', name: 'English L1' })
        .mockResolvedValueOnce({ id: 'sub-3', name: 'Science L1' })
        .mockResolvedValueOnce({ id: 'sub-4', name: 'Social Studies L1' })
        .mockResolvedValueOnce({ id: 'sub-5', name: 'Word Building L1' })
        .mockResolvedValueOnce({ id: 'sub-6', name: 'Español L1' })
        // L2 subjects
        .mockResolvedValue({ id: 'sub-7', name: 'Math L2' })
        .mockResolvedValue({ id: 'sub-8', name: 'English L2' })
        .mockResolvedValue({ id: 'sub-9', name: 'Science L2' })
        .mockResolvedValue({ id: 'sub-10', name: 'Social Studies L2' })
        .mockResolvedValue({ id: 'sub-11', name: 'Word Building L2' })
        .mockResolvedValue({ id: 'sub-12', name: 'Español y Ortografía L2' });

      let l1SubjectNames: string[] = [];
      let l2SubjectNames: string[] = [];

      vi.mocked(mockRepository.create).mockImplementation(async (template) => {
        if (template.level === 'L1') {
          l1SubjectNames = template.templateSubjects.map(s => s.subSubjectName);
        } else if (template.level === 'L2') {
          l2SubjectNames = template.templateSubjects.map(s => s.subSubjectName);
        }
        return {
          id: 'template-1',
          ...template,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      // Act
      await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(l1SubjectNames).toContain('Español L1');
      expect(l2SubjectNames).toContain('Español y Ortografía L2');
    });

    it('should not create template if no subjects found', async () => {
      // Arrange
      mockPrisma.projectionTemplate.findFirst.mockResolvedValue(null);
      mockPrisma.subSubject.findFirst.mockResolvedValue(null); // No subjects found

      // Act
      await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should create template with correct properties', async () => {
      // Arrange
      mockPrisma.projectionTemplate.findFirst.mockResolvedValue(null);
      mockPrisma.subSubject.findFirst.mockResolvedValue({
        id: 'sub-1',
        name: 'Math L1',
      });

      vi.mocked(mockRepository.create).mockResolvedValue({
        id: 'template-1',
        name: 'Plantilla L1',
        level: 'L1',
        isDefault: true,
        isActive: true,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        templateSubjects: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Plantilla L1',
          level: 'L1',
          isDefault: true,
          isActive: true,
          schoolId: TEST_CONSTANTS.SCHOOL_ID,
          templateSubjects: expect.arrayContaining([
            expect.objectContaining({
              subSubjectId: 'sub-1',
              subSubjectName: 'Math L1',
              startPace: 1001,
              endPace: 1012,
              skipPaces: [],
              notPairWith: [],
              extendToNext: false,
            }),
          ]),
        })
      );
    });

    it('should set correct order for template subjects', async () => {
      // Arrange
      mockPrisma.projectionTemplate.findFirst.mockResolvedValue(null);
      mockPrisma.subSubject.findFirst
        .mockResolvedValueOnce({ id: 'sub-1', name: 'Math L1' })
        .mockResolvedValueOnce({ id: 'sub-2', name: 'English L1' })
        .mockResolvedValueOnce({ id: 'sub-3', name: 'Science L1' })
        .mockResolvedValueOnce({ id: 'sub-4', name: 'Social Studies L1' })
        .mockResolvedValueOnce({ id: 'sub-5', name: 'Word Building L1' })
        .mockResolvedValueOnce({ id: 'sub-6', name: 'Español L1' })
        .mockResolvedValue({ id: 'sub-7', name: 'Math L2' });

      let subjectOrders: number[] = [];

      vi.mocked(mockRepository.create).mockImplementation(async (template) => {
        if (template.level === 'L1') {
          subjectOrders = template.templateSubjects.map(s => s.order);
        }
        return {
          id: 'template-1',
          ...template,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      // Act
      await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(subjectOrders).toEqual([0, 1, 2, 3, 4, 5]);
    });

    it('should handle partial subject matches gracefully', async () => {
      // Arrange
      mockPrisma.projectionTemplate.findFirst.mockResolvedValue(null);
      // Some subjects found, some not
      mockPrisma.subSubject.findFirst
        .mockResolvedValueOnce({ id: 'sub-1', name: 'Math L1' })
        .mockResolvedValueOnce(null) // English L1 not found
        .mockResolvedValueOnce({ id: 'sub-3', name: 'Science L1' })
        .mockResolvedValueOnce(null) // Social Studies L1 not found
        .mockResolvedValueOnce({ id: 'sub-5', name: 'Word Building L1' })
        .mockResolvedValueOnce({ id: 'sub-6', name: 'Español L1' })
        .mockResolvedValue({ id: 'sub-7', name: 'Math L2' });

      vi.mocked(mockRepository.create).mockResolvedValue({
        id: 'template-1',
        name: 'Plantilla L1',
        level: 'L1',
        isDefault: true,
        isActive: true,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        templateSubjects: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      // Should still create template with found subjects
      expect(mockRepository.create).toHaveBeenCalled();
      // L1 should have 4 subjects (Math, Science, Word Building, Español)
      const l1Call = vi.mocked(mockRepository.create).mock.calls.find(
        call => call[0].level === 'L1'
      );
      expect(l1Call?.[0].templateSubjects.length).toBe(4);
    });
  });
});

