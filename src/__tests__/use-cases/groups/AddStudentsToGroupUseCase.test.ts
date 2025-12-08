import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddStudentsToGroupUseCase } from '../../../core/app/use-cases/groups/AddStudentsToGroupUseCase';
import { createMockGroupRepository } from '../../utils/mockRepositories';
import { createTestGroupStudent, TEST_CONSTANTS } from '../../utils/testHelpers';

describe('AddStudentsToGroupUseCase', () => {
  let useCase: AddStudentsToGroupUseCase;
  let mockRepository: ReturnType<typeof createMockGroupRepository>;

  beforeEach(() => {
    mockRepository = createMockGroupRepository();
    useCase = new AddStudentsToGroupUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should add students to group successfully', async () => {
      const studentIds = ['student-1', 'student-2'];
      const groupStudents = [
        createTestGroupStudent({ id: 'gs-1', studentId: 'student-1' }),
        createTestGroupStudent({ id: 'gs-2', studentId: 'student-2' }),
      ];

      vi.mocked(mockRepository.addStudentsToGroup).mockResolvedValue(groupStudents);

      const result = await useCase.execute({
        groupId: TEST_CONSTANTS.GROUP_ID,
        studentIds,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      expect(result).toEqual(groupStudents);
      expect(mockRepository.addStudentsToGroup).toHaveBeenCalledWith(
        TEST_CONSTANTS.GROUP_ID,
        studentIds,
        TEST_CONSTANTS.SCHOOL_ID
      );
    });

    it('should add single student to group', async () => {
      const studentIds = ['student-1'];
      const groupStudents = [
        createTestGroupStudent({ id: 'gs-1', studentId: 'student-1' }),
      ];

      vi.mocked(mockRepository.addStudentsToGroup).mockResolvedValue(groupStudents);

      const result = await useCase.execute({
        groupId: TEST_CONSTANTS.GROUP_ID,
        studentIds,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      expect(result).toEqual(groupStudents);
      expect(mockRepository.addStudentsToGroup).toHaveBeenCalledWith(
        TEST_CONSTANTS.GROUP_ID,
        studentIds,
        TEST_CONSTANTS.SCHOOL_ID
      );
    });

    it('should handle empty studentIds array', async () => {
      vi.mocked(mockRepository.addStudentsToGroup).mockResolvedValue([]);

      const result = await useCase.execute({
        groupId: TEST_CONSTANTS.GROUP_ID,
        studentIds: [],
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      expect(result).toEqual([]);
      expect(mockRepository.addStudentsToGroup).toHaveBeenCalledWith(
        TEST_CONSTANTS.GROUP_ID,
        [],
        TEST_CONSTANTS.SCHOOL_ID
      );
    });
  });
});

