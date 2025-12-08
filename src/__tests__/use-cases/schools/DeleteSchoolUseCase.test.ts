import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteSchoolUseCase } from '../../../core/app/use-cases/schools/DeleteSchoolUseCase';
import { createMockSchoolRepository } from '../../utils/mockRepositories';
import { School } from '../../../core/domain/entities';

describe('DeleteSchoolUseCase', () => {
  let useCase: DeleteSchoolUseCase;
  let mockRepository: ReturnType<typeof createMockSchoolRepository>;

  beforeEach(() => {
    mockRepository = createMockSchoolRepository();
    useCase = new DeleteSchoolUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should delete school when found', async () => {
      // Arrange
      const school = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: true,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(school);
      vi.mocked(mockRepository.delete).mockResolvedValue(undefined);

      // Act
      await useCase.execute('school-1');

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith('school-1');
      expect(mockRepository.delete).toHaveBeenCalledWith('school-1');
    });

    it('should throw error when school not found', async () => {
      // Arrange
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute('non-existent-id')).rejects.toThrow('School not found');
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should delete inactive school', async () => {
      // Arrange
      const school = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: false,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(school);
      vi.mocked(mockRepository.delete).mockResolvedValue(undefined);

      // Act
      await useCase.execute('school-1');

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith('school-1');
    });
  });
});

