import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetStudentAssignmentsForSchoolYearUseCase } from '../../../core/app/use-cases/deprecated/groups/GetStudentAssignmentsForSchoolYearUseCase';
import { createMockGroupRepository } from '../../utils/mockRepositories';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

describe('GetStudentAssignmentsForSchoolYearUseCase', () => {
  let useCase: GetStudentAssignmentsForSchoolYearUseCase;
  let mockRepository: ReturnType<typeof createMockGroupRepository>;

  beforeEach(() => {
    mockRepository = createMockGroupRepository();
    useCase = new GetStudentAssignmentsForSchoolYearUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return student assignments for school year', async () => {
      const assignments = [
        { studentId: 'student-1', groupId: 'group-1' },
        { studentId: 'student-2', groupId: 'group-1' },
        { studentId: 'student-3', groupId: 'group-2' },
      ];

      vi.mocked(mockRepository.getStudentAssignmentsForSchoolYear).mockResolvedValue(assignments);

      const result = await useCase.execute({
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      expect(result).toEqual(assignments);
      expect(mockRepository.getStudentAssignmentsForSchoolYear).toHaveBeenCalledWith(
        TEST_CONSTANTS.SCHOOL_YEAR_ID,
        TEST_CONSTANTS.SCHOOL_ID
      );
    });

    it('should return empty array when no assignments exist', async () => {
      vi.mocked(mockRepository.getStudentAssignmentsForSchoolYear).mockResolvedValue([]);

      const result = await useCase.execute({
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      expect(result).toEqual([]);
      expect(mockRepository.getStudentAssignmentsForSchoolYear).toHaveBeenCalledWith(
        TEST_CONSTANTS.SCHOOL_YEAR_ID,
        TEST_CONSTANTS.SCHOOL_ID
      );
    });

    it('should handle multiple students in same group', async () => {
      const assignments = [
        { studentId: 'student-1', groupId: 'group-1' },
        { studentId: 'student-2', groupId: 'group-1' },
        { studentId: 'student-3', groupId: 'group-1' },
      ];

      vi.mocked(mockRepository.getStudentAssignmentsForSchoolYear).mockResolvedValue(assignments);

      const result = await useCase.execute({
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      expect(result).toEqual(assignments);
      expect(result.length).toBe(3);
      expect(result.every(a => a.groupId === 'group-1')).toBe(true);
    });

    it('should handle students in different groups', async () => {
      const assignments = [
        { studentId: 'student-1', groupId: 'group-1' },
        { studentId: 'student-2', groupId: 'group-2' },
        { studentId: 'student-3', groupId: 'group-3' },
      ];

      vi.mocked(mockRepository.getStudentAssignmentsForSchoolYear).mockResolvedValue(assignments);

      const result = await useCase.execute({
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      expect(result).toEqual(assignments);
      expect(result.length).toBe(3);
      expect(new Set(result.map(a => a.groupId)).size).toBe(3);
    });
  });
});

