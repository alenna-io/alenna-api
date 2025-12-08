import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetGroupByIdUseCase } from '../../../core/app/use-cases/groups/GetGroupByIdUseCase';
import { createMockGroupRepository } from '../../utils/mockRepositories';
import { createTestGroup, TEST_CONSTANTS } from '../../utils/testHelpers';

describe('GetGroupByIdUseCase', () => {
  let useCase: GetGroupByIdUseCase;
  let mockRepository: ReturnType<typeof createMockGroupRepository>;

  beforeEach(() => {
    mockRepository = createMockGroupRepository();
    useCase = new GetGroupByIdUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return group when found', async () => {
      const group = createTestGroup({ id: TEST_CONSTANTS.GROUP_ID });

      vi.mocked(mockRepository.findById).mockResolvedValue(group);

      const result = await useCase.execute({
        id: TEST_CONSTANTS.GROUP_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      expect(result).toEqual(group);
      expect(mockRepository.findById).toHaveBeenCalledWith(
        TEST_CONSTANTS.GROUP_ID,
        TEST_CONSTANTS.SCHOOL_ID
      );
    });

    it('should return null when group not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      const result = await useCase.execute({
        id: 'non-existent-group',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      expect(result).toBeNull();
      expect(mockRepository.findById).toHaveBeenCalledWith(
        'non-existent-group',
        TEST_CONSTANTS.SCHOOL_ID
      );
    });

    it('should return group with specific name', async () => {
      const group = createTestGroup({
        id: TEST_CONSTANTS.GROUP_ID,
        name: 'Math Class',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(group);

      const result = await useCase.execute({
        id: TEST_CONSTANTS.GROUP_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      expect(result).toEqual(group);
      expect(result?.name).toBe('Math Class');
    });
  });
});

