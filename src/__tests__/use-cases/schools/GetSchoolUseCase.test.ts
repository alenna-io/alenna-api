import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetSchoolUseCase } from '../../../core/app/use-cases/schools/GetSchoolUseCase';
import { createMockSchoolRepository } from '../../utils/mockRepositories';
import { School } from '../../../core/domain/entities/deprecated';

describe('GetSchoolUseCase', () => {
  let useCase: GetSchoolUseCase;
  let mockRepository: ReturnType<typeof createMockSchoolRepository>;

  beforeEach(() => {
    mockRepository = createMockSchoolRepository();
    useCase = new GetSchoolUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return school when found', async () => {
      // Arrange
      const school = School.create({
        id: 'school-1',
        name: 'Test School',
        address: '123 Main St',
        phone: '555-1234',
        email: 'test@school.com',
        teacherLimit: 50,
        userLimit: 200,
        isActive: true,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(school);

      // Act
      const result = await useCase.execute('school-1');

      // Assert
      expect(result.id).toBe('school-1');
      expect(result.name).toBe('Test School');
      expect(result.address).toBe('123 Main St');
      expect(result.phone).toBe('555-1234');
      expect(result.email).toBe('test@school.com');
      expect(result.teacherLimit).toBe(50);
      expect(result.userLimit).toBe(200);
      expect(result.isActive).toBe(true);
      expect(mockRepository.findById).toHaveBeenCalledWith('school-1');
    });

    it('should throw error when school not found', async () => {
      // Arrange
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute('non-existent-id')).rejects.toThrow('School not found');
      expect(mockRepository.findById).toHaveBeenCalledWith('non-existent-id');
    });

    it('should return school with optional fields undefined', async () => {
      // Arrange
      const school = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: true,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(school);

      // Act
      const result = await useCase.execute('school-1');

      // Assert
      expect(result.id).toBe('school-1');
      expect(result.name).toBe('Test School');
      expect(result.address).toBeUndefined();
      expect(result.phone).toBeUndefined();
      expect(result.email).toBeUndefined();
      expect(result.teacherLimit).toBeUndefined();
      expect(result.userLimit).toBeUndefined();
    });

    it('should return inactive school', async () => {
      // Arrange
      const school = School.create({
        id: 'school-1',
        name: 'Test School',
        isActive: false,
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(school);

      // Act
      const result = await useCase.execute('school-1');

      // Assert
      expect(result.isActive).toBe(false);
    });
  });
});

