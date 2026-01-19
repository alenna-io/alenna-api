import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RemoveStudentFromGroupUseCase } from '../../../core/app/use-cases/deprecated/groups/RemoveStudentFromGroupUseCase';
import { createMockGroupRepository } from '../../utils/mockRepositories';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

describe('RemoveStudentFromGroupUseCase', () => {
  let useCase: RemoveStudentFromGroupUseCase;
  let mockRepository: ReturnType<typeof createMockGroupRepository>;

  beforeEach(() => {
    mockRepository = createMockGroupRepository();
    useCase = new RemoveStudentFromGroupUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should remove student from group successfully', async () => {
      vi.mocked(mockRepository.removeStudentFromGroup).mockResolvedValue(undefined);

      await useCase.execute({
        groupId: TEST_CONSTANTS.GROUP_ID,
        studentId: TEST_CONSTANTS.STUDENT_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      expect(mockRepository.removeStudentFromGroup).toHaveBeenCalledWith(
        TEST_CONSTANTS.GROUP_ID,
        TEST_CONSTANTS.STUDENT_ID,
        TEST_CONSTANTS.SCHOOL_ID
      );
      expect(mockRepository.removeStudentFromGroup).toHaveBeenCalledTimes(1);
    });

    it('should handle removal with different group and student IDs', async () => {
      const groupId = 'group-2';
      const studentId = 'student-2';

      vi.mocked(mockRepository.removeStudentFromGroup).mockResolvedValue(undefined);

      await useCase.execute({
        groupId,
        studentId,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      expect(mockRepository.removeStudentFromGroup).toHaveBeenCalledWith(
        groupId,
        studentId,
        TEST_CONSTANTS.SCHOOL_ID
      );
    });
  });
});

