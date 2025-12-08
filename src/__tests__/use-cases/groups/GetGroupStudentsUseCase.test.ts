import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetGroupStudentsUseCase } from '../../../core/app/use-cases/groups/GetGroupStudentsUseCase';
import { createMockGroupRepository } from '../../utils/mockRepositories';
import { createTestGroupStudent, TEST_CONSTANTS } from '../../utils/testHelpers';

describe('GetGroupStudentsUseCase', () => {
  let useCase: GetGroupStudentsUseCase;
  let mockRepository: ReturnType<typeof createMockGroupRepository>;

  beforeEach(() => {
    mockRepository = createMockGroupRepository();
    useCase = new GetGroupStudentsUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return group students', async () => {
      const groupStudents = [
        createTestGroupStudent({ id: 'gs-1', studentId: 'student-1' }),
        createTestGroupStudent({ id: 'gs-2', studentId: 'student-2' }),
      ];

      vi.mocked(mockRepository.getGroupStudents).mockResolvedValue(groupStudents);

      const result = await useCase.execute({
        groupId: TEST_CONSTANTS.GROUP_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      expect(result).toEqual(groupStudents);
      expect(mockRepository.getGroupStudents).toHaveBeenCalledWith(
        TEST_CONSTANTS.GROUP_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        false
      );
    });

    it('should return empty array when group has no students', async () => {
      vi.mocked(mockRepository.getGroupStudents).mockResolvedValue([]);

      const result = await useCase.execute({
        groupId: TEST_CONSTANTS.GROUP_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      expect(result).toEqual([]);
      expect(mockRepository.getGroupStudents).toHaveBeenCalledWith(
        TEST_CONSTANTS.GROUP_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        false
      );
    });

    it('should include deleted students when includeDeleted is true', async () => {
      const groupStudents = [
        createTestGroupStudent({ id: 'gs-1', studentId: 'student-1' }),
        createTestGroupStudent({ id: 'gs-2', studentId: 'student-2', deletedAt: new Date() }),
      ];

      vi.mocked(mockRepository.getGroupStudents).mockResolvedValue(groupStudents);

      const result = await useCase.execute({
        groupId: TEST_CONSTANTS.GROUP_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        includeDeleted: true,
      });

      expect(result).toEqual(groupStudents);
      expect(mockRepository.getGroupStudents).toHaveBeenCalledWith(
        TEST_CONSTANTS.GROUP_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        true
      );
    });

    it('should exclude deleted students by default', async () => {
      const groupStudents = [
        createTestGroupStudent({ id: 'gs-1', studentId: 'student-1' }),
      ];

      vi.mocked(mockRepository.getGroupStudents).mockResolvedValue(groupStudents);

      const result = await useCase.execute({
        groupId: TEST_CONSTANTS.GROUP_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        includeDeleted: false,
      });

      expect(result).toEqual(groupStudents);
      expect(mockRepository.getGroupStudents).toHaveBeenCalledWith(
        TEST_CONSTANTS.GROUP_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        false
      );
    });
  });
});

