import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteGroupUseCase } from '../../../core/app/use-cases/groups/DeleteGroupUseCase';
import { createMockGroupRepository } from '../../utils/mockRepositories';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

describe('DeleteGroupUseCase', () => {
  let useCase: DeleteGroupUseCase;
  let mockRepository: ReturnType<typeof createMockGroupRepository>;

  beforeEach(() => {
    mockRepository = createMockGroupRepository();
    useCase = new DeleteGroupUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should delete group successfully', async () => {
      vi.mocked(mockRepository.delete).mockResolvedValue(undefined);

      await useCase.execute({
        id: TEST_CONSTANTS.GROUP_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      expect(mockRepository.delete).toHaveBeenCalledWith(
        TEST_CONSTANTS.GROUP_ID,
        TEST_CONSTANTS.SCHOOL_ID
      );
      expect(mockRepository.delete).toHaveBeenCalledTimes(1);
    });

    it('should handle deletion with different group ID', async () => {
      const groupId = 'group-2';

      vi.mocked(mockRepository.delete).mockResolvedValue(undefined);

      await useCase.execute({
        id: groupId,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      expect(mockRepository.delete).toHaveBeenCalledWith(
        groupId,
        TEST_CONSTANTS.SCHOOL_ID
      );
    });

    it('should handle deletion with different school ID', async () => {
      const schoolId = 'school-2';

      vi.mocked(mockRepository.delete).mockResolvedValue(undefined);

      await useCase.execute({
        id: TEST_CONSTANTS.GROUP_ID,
        schoolId,
      });

      expect(mockRepository.delete).toHaveBeenCalledWith(
        TEST_CONSTANTS.GROUP_ID,
        schoolId
      );
    });
  });
});

