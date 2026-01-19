import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetUsersUseCase } from '../../../core/app/use-cases/deprecated/users/GetUsersUseCase';
import { createMockUserRepository } from '../../utils/mockRepositories';
import { createTestUser, TEST_CONSTANTS } from '../../utils/testHelpers';

describe('GetUsersUseCase', () => {
  let useCase: GetUsersUseCase;
  let mockRepository: ReturnType<typeof createMockUserRepository>;

  beforeEach(() => {
    mockRepository = createMockUserRepository();
    useCase = new GetUsersUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return users for a specific school', async () => {
      const users = [
        createTestUser({ id: 'user-1', schoolId: TEST_CONSTANTS.SCHOOL_ID }),
        createTestUser({ id: 'user-2', schoolId: TEST_CONSTANTS.SCHOOL_ID }),
      ];

      vi.mocked(mockRepository.findBySchoolId).mockResolvedValue(users);

      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      expect(result).toEqual(users);
      expect(mockRepository.findBySchoolId).toHaveBeenCalledWith(TEST_CONSTANTS.SCHOOL_ID);
      expect(mockRepository.findAll).not.toHaveBeenCalled();
    });

    it('should return all users when schoolId is not provided', async () => {
      const users = [
        createTestUser({ id: 'user-1', schoolId: 'school-1' }),
        createTestUser({ id: 'user-2', schoolId: 'school-2' }),
      ];

      vi.mocked(mockRepository.findAll).mockResolvedValue(users);

      const result = await useCase.execute();

      expect(result).toEqual(users);
      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(mockRepository.findBySchoolId).not.toHaveBeenCalled();
    });

    it('should return empty array when no users exist for school', async () => {
      vi.mocked(mockRepository.findBySchoolId).mockResolvedValue([]);

      const result = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);

      expect(result).toEqual([]);
      expect(mockRepository.findBySchoolId).toHaveBeenCalledWith(TEST_CONSTANTS.SCHOOL_ID);
    });

    it('should return empty array when no users exist at all', async () => {
      vi.mocked(mockRepository.findAll).mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result).toEqual([]);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });
  });
});

