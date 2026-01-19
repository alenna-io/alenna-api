import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateSchoolUseCase } from '../../../core/app/use-cases/schools/UpdateSchoolUseCase';
import { createMockSchoolRepository } from '../../utils/mockRepositories';
import { School } from '../../../core/domain/entities/deprecated';

describe('UpdateSchoolUseCase', () => {
  let useCase: UpdateSchoolUseCase;
  let mockRepository: ReturnType<typeof createMockSchoolRepository>;

  beforeEach(() => {
    mockRepository = createMockSchoolRepository();
    useCase = new UpdateSchoolUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should update school with all fields', async () => {
      // Arrange
      const existingSchool = School.create({
        id: 'school-1',
        name: 'Old Name',
        isActive: true,
      });

      const updatedSchool = School.create({
        id: 'school-1',
        name: 'New Name',
        address: '456 New St',
        phone: '555-5678',
        email: 'new@school.com',
        teacherLimit: 75,
        userLimit: 300,
        isActive: true,
      });

      const input = {
        name: 'New Name',
        address: '456 New St',
        phone: '555-5678',
        email: 'new@school.com',
        teacherLimit: 75,
        userLimit: 300,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(existingSchool);
      vi.mocked(mockRepository.update).mockResolvedValue(updatedSchool);

      // Act
      const result = await useCase.execute('school-1', input);

      // Assert
      expect(result.name).toBe('New Name');
      expect(result.address).toBe('456 New St');
      expect(result.phone).toBe('555-5678');
      expect(result.email).toBe('new@school.com');
      expect(result.teacherLimit).toBe(75);
      expect(result.userLimit).toBe(300);
      expect(mockRepository.findById).toHaveBeenCalledWith('school-1');
      expect(mockRepository.update).toHaveBeenCalledWith('school-1', input);
    });

    it('should update only provided fields', async () => {
      // Arrange
      const existingSchool = School.create({
        id: 'school-1',
        name: 'Old Name',
        address: '123 Old St',
        phone: '555-1234',
        isActive: true,
      });

      const updatedSchool = School.create({
        id: 'school-1',
        name: 'New Name',
        address: '123 Old St',
        phone: '555-1234',
        isActive: true,
      });

      const input = {
        name: 'New Name',
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(existingSchool);
      vi.mocked(mockRepository.update).mockResolvedValue(updatedSchool);

      // Act
      const result = await useCase.execute('school-1', input);

      // Assert
      expect(result.name).toBe('New Name');
      expect(mockRepository.update).toHaveBeenCalledWith('school-1', input);
    });

    it('should throw error when school not found', async () => {
      // Arrange
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      const input = {
        name: 'New Name',
      };

      // Act & Assert
      await expect(useCase.execute('non-existent-id', input)).rejects.toThrow('School not found');
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should update contact information', async () => {
      // Arrange
      const existingSchool = School.create({
        id: 'school-1',
        name: 'Test School',
        address: '123 Old St',
        phone: '555-1234',
        email: 'old@school.com',
        isActive: true,
      });

      const updatedSchool = School.create({
        id: 'school-1',
        name: 'Test School',
        address: '456 New St',
        phone: '555-5678',
        email: 'new@school.com',
        isActive: true,
      });

      const input = {
        address: '456 New St',
        phone: '555-5678',
        email: 'new@school.com',
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(existingSchool);
      vi.mocked(mockRepository.update).mockResolvedValue(updatedSchool);

      // Act
      const result = await useCase.execute('school-1', input);

      // Assert
      expect(result.address).toBe('456 New St');
      expect(result.phone).toBe('555-5678');
      expect(result.email).toBe('new@school.com');
    });

    it('should update limits', async () => {
      // Arrange
      const existingSchool = School.create({
        id: 'school-1',
        name: 'Test School',
        teacherLimit: 50,
        userLimit: 200,
        isActive: true,
      });

      const updatedSchool = School.create({
        id: 'school-1',
        name: 'Test School',
        teacherLimit: 100,
        userLimit: 400,
        isActive: true,
      });

      const input = {
        teacherLimit: 100,
        userLimit: 400,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(existingSchool);
      vi.mocked(mockRepository.update).mockResolvedValue(updatedSchool);

      // Act
      const result = await useCase.execute('school-1', input);

      // Assert
      expect(result.teacherLimit).toBe(100);
      expect(result.userLimit).toBe(400);
    });
  });
});

