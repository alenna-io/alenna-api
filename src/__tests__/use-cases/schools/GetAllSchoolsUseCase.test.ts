import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetAllSchoolsUseCase } from '../../../core/app/use-cases/schools/GetAllSchoolsUseCase';
import { createMockSchoolRepository } from '../../utils/mockRepositories';
import { School } from '../../../core/domain/entities/deprecated';

describe('GetAllSchoolsUseCase', () => {
  let useCase: GetAllSchoolsUseCase;
  let mockRepository: ReturnType<typeof createMockSchoolRepository>;

  beforeEach(() => {
    mockRepository = createMockSchoolRepository();
    useCase = new GetAllSchoolsUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return all schools', async () => {
      // Arrange
      const schools = [
        School.create({
          id: 'school-1',
          name: 'School 1',
          isActive: true,
        }),
        School.create({
          id: 'school-2',
          name: 'School 2',
          isActive: false,
        }),
        School.create({
          id: 'school-3',
          name: 'School 3',
          isActive: true,
        }),
      ];

      vi.mocked(mockRepository.findAll).mockResolvedValue(schools);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('school-1');
      expect(result[1].id).toBe('school-2');
      expect(result[2].id).toBe('school-3');
      expect(mockRepository.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no schools found', async () => {
      // Arrange
      vi.mocked(mockRepository.findAll).mockResolvedValue([]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual([]);
    });

    it('should return schools with all fields', async () => {
      // Arrange
      const schools = [
        School.create({
          id: 'school-1',
          name: 'School 1',
          address: '123 Main St',
          phone: '555-1234',
          email: 'school1@test.com',
          teacherLimit: 50,
          userLimit: 200,
          isActive: true,
        }),
      ];

      vi.mocked(mockRepository.findAll).mockResolvedValue(schools);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result[0].address).toBe('123 Main St');
      expect(result[0].phone).toBe('555-1234');
      expect(result[0].email).toBe('school1@test.com');
      expect(result[0].teacherLimit).toBe(50);
      expect(result[0].userLimit).toBe(200);
    });
  });
});

