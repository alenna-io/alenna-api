import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetProjectionTemplatesUseCase } from '../../../core/app/use-cases/projection-templates/GetProjectionTemplatesUseCase';
import { createMockProjectionTemplateRepository } from '../../utils/mockRepositories';
import { createTestProjectionTemplate, TEST_CONSTANTS } from '../../utils/testHelpers';

describe('GetProjectionTemplatesUseCase', () => {
  let useCase: GetProjectionTemplatesUseCase;
  let mockRepository: ReturnType<typeof createMockProjectionTemplateRepository>;

  beforeEach(() => {
    mockRepository = createMockProjectionTemplateRepository();
    useCase = new GetProjectionTemplatesUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return all templates for school when no level specified', async () => {
      // Arrange
      const templates = [
        createTestProjectionTemplate({
          id: 'template-1',
          name: 'Plantilla L1',
          level: 'L1',
        }),
        createTestProjectionTemplate({
          id: 'template-2',
          name: 'Plantilla L2',
          level: 'L2',
        }),
      ];

      vi.mocked(mockRepository.findBySchoolId).mockResolvedValue(templates);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('template-1');
      expect(result[1].id).toBe('template-2');
      expect(mockRepository.findBySchoolId).toHaveBeenCalledWith(TEST_CONSTANTS.SCHOOL_ID);
      expect(mockRepository.findByLevel).not.toHaveBeenCalled();
    });

    it('should return templates filtered by level when level specified', async () => {
      // Arrange
      const templates = [
        createTestProjectionTemplate({
          id: 'template-1',
          name: 'Plantilla L1',
          level: 'L1',
        }),
      ];

      vi.mocked(mockRepository.findByLevel).mockResolvedValue(templates);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'L1');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].level).toBe('L1');
      expect(mockRepository.findByLevel).toHaveBeenCalledWith(TEST_CONSTANTS.SCHOOL_ID, 'L1');
      expect(mockRepository.findBySchoolId).not.toHaveBeenCalled();
    });

    it('should map template properties correctly', async () => {
      // Arrange
      const template = createTestProjectionTemplate({
        id: 'template-1',
        name: 'Plantilla L1',
        level: 'L1',
        isDefault: true,
        isActive: true,
        templateSubjects: [
          {
            id: 'subject-1',
            subSubjectId: 'sub-subject-1',
            subSubjectName: 'Math L1',
            startPace: 1001,
            endPace: 1012,
            skipPaces: [1005],
            notPairWith: ['English L1'],
            extendToNext: false,
            order: 0,
          },
        ],
      });

      vi.mocked(mockRepository.findBySchoolId).mockResolvedValue([template]);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result[0]).toEqual({
        id: 'template-1',
        name: 'Plantilla L1',
        level: 'L1',
        isDefault: true,
        isActive: true,
        subjects: [
          {
            subSubjectId: 'sub-subject-1',
            subSubjectName: 'Math L1',
            startPace: 1001,
            endPace: 1012,
            skipPaces: [1005],
            notPairWith: ['English L1'],
            extendToNext: false,
          },
        ],
      });
    });

    it('should return empty array when no templates found', async () => {
      // Arrange
      vi.mocked(mockRepository.findBySchoolId).mockResolvedValue([]);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle templates with multiple subjects', async () => {
      // Arrange
      const template = createTestProjectionTemplate({
        id: 'template-1',
        templateSubjects: [
          {
            id: 'subject-1',
            subSubjectId: 'sub-subject-1',
            subSubjectName: 'Math L1',
            startPace: 1001,
            endPace: 1012,
            skipPaces: [],
            notPairWith: [],
            extendToNext: false,
            order: 0,
          },
          {
            id: 'subject-2',
            subSubjectId: 'sub-subject-2',
            subSubjectName: 'English L1',
            startPace: 1001,
            endPace: 1012,
            skipPaces: [],
            notPairWith: [],
            extendToNext: false,
            order: 1,
          },
        ],
      });

      vi.mocked(mockRepository.findBySchoolId).mockResolvedValue([template]);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result[0].subjects).toHaveLength(2);
      expect(result[0].subjects[0].subSubjectName).toBe('Math L1');
      expect(result[0].subjects[1].subSubjectName).toBe('English L1');
    });
  });
});

