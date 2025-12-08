import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetProjectionTemplateByLevelUseCase } from '../../../core/app/use-cases/projection-templates/GetProjectionTemplateByLevelUseCase';
import { createMockProjectionTemplateRepository } from '../../utils/mockRepositories';
import { createTestProjectionTemplate, TEST_CONSTANTS } from '../../utils/testHelpers';

describe('GetProjectionTemplateByLevelUseCase', () => {
  let useCase: GetProjectionTemplateByLevelUseCase;
  let mockRepository: ReturnType<typeof createMockProjectionTemplateRepository>;

  beforeEach(() => {
    mockRepository = createMockProjectionTemplateRepository();
    useCase = new GetProjectionTemplateByLevelUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return default template when found', async () => {
      // Arrange
      const defaultTemplate = createTestProjectionTemplate({
        id: 'template-1',
        name: 'Plantilla L1',
        level: 'L1',
        isDefault: true,
        isActive: true,
      });

      vi.mocked(mockRepository.findDefaultByLevel).mockResolvedValue(defaultTemplate);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'L1');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe('template-1');
      expect(result?.level).toBe('L1');
      expect(result?.isDefault).toBe(true);
      expect(mockRepository.findDefaultByLevel).toHaveBeenCalledWith(TEST_CONSTANTS.SCHOOL_ID, 'L1');
      expect(mockRepository.findByLevel).not.toHaveBeenCalled();
    });

    it('should return first active template when no default template found', async () => {
      // Arrange
      const templates = [
        createTestProjectionTemplate({
          id: 'template-1',
          name: 'Custom Template L1',
          level: 'L1',
          isDefault: false,
          isActive: true,
        }),
        createTestProjectionTemplate({
          id: 'template-2',
          name: 'Inactive Template L1',
          level: 'L1',
          isDefault: false,
          isActive: false,
        }),
      ];

      vi.mocked(mockRepository.findDefaultByLevel).mockResolvedValue(null);
      vi.mocked(mockRepository.findByLevel).mockResolvedValue(templates);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'L1');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe('template-1');
      expect(result?.isActive).toBe(true);
      expect(mockRepository.findByLevel).toHaveBeenCalledWith(TEST_CONSTANTS.SCHOOL_ID, 'L1');
    });

    it('should return null when no templates found for level', async () => {
      // Arrange
      vi.mocked(mockRepository.findDefaultByLevel).mockResolvedValue(null);
      vi.mocked(mockRepository.findByLevel).mockResolvedValue([]);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'L1');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when only inactive templates found', async () => {
      // Arrange
      const templates = [
        createTestProjectionTemplate({
          id: 'template-1',
          name: 'Inactive Template L1',
          level: 'L1',
          isDefault: false,
          isActive: false,
        }),
      ];

      vi.mocked(mockRepository.findDefaultByLevel).mockResolvedValue(null);
      vi.mocked(mockRepository.findByLevel).mockResolvedValue(templates);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'L1');

      // Assert
      expect(result).toBeNull();
    });

    it('should map template subjects correctly', async () => {
      // Arrange
      const defaultTemplate = createTestProjectionTemplate({
        id: 'template-1',
        level: 'L1',
        templateSubjects: [
          {
            id: 'subject-1',
            subSubjectId: 'sub-subject-1',
            subSubjectName: 'Math L1',
            startPace: 1001,
            endPace: 1012,
            skipPaces: [1005],
            notPairWith: ['English L1'],
            extendToNext: true,
            order: 0,
          },
        ],
      });

      vi.mocked(mockRepository.findDefaultByLevel).mockResolvedValue(defaultTemplate);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'L1');

      // Assert
      expect(result?.subjects).toHaveLength(1);
      expect(result?.subjects[0]).toEqual({
        subSubjectId: 'sub-subject-1',
        subSubjectName: 'Math L1',
        startPace: 1001,
        endPace: 1012,
        skipPaces: [1005],
        notPairWith: ['English L1'],
        extendToNext: true,
      });
    });

    it('should prioritize default template over custom templates', async () => {
      // Arrange
      const defaultTemplate = createTestProjectionTemplate({
        id: 'template-default',
        name: 'Default Template L1',
        level: 'L1',
        isDefault: true,
      });

      vi.mocked(mockRepository.findDefaultByLevel).mockResolvedValue(defaultTemplate);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID, 'L1');

      // Assert
      expect(result?.id).toBe('template-default');
      expect(result?.isDefault).toBe(true);
      expect(mockRepository.findByLevel).not.toHaveBeenCalled();
    });
  });
});

