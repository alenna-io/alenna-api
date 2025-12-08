import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetStudentsByTeacherUseCase } from '../../../core/app/use-cases/groups/GetStudentsByTeacherUseCase';
import { createMockGroupRepository } from '../../utils/mockRepositories';
import { createTestGroup, TEST_CONSTANTS } from '../../utils/testHelpers';

describe('GetStudentsByTeacherUseCase', () => {
  let useCase: GetStudentsByTeacherUseCase;
  let mockRepository: ReturnType<typeof createMockGroupRepository>;

  beforeEach(() => {
    mockRepository = createMockGroupRepository();
    useCase = new GetStudentsByTeacherUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return groups for teacher and school year', async () => {
      const groups = [
        createTestGroup({ id: 'group-1', teacherId: TEST_CONSTANTS.TEACHER_ID }),
        createTestGroup({ id: 'group-2', teacherId: TEST_CONSTANTS.TEACHER_ID }),
      ];

      vi.mocked(mockRepository.findByTeacherIdAndSchoolYearId).mockResolvedValue(groups);

      const result = await useCase.execute({
        teacherId: TEST_CONSTANTS.TEACHER_ID,
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      expect(result).toEqual(groups);
      expect(mockRepository.findByTeacherIdAndSchoolYearId).toHaveBeenCalledWith(
        TEST_CONSTANTS.TEACHER_ID,
        TEST_CONSTANTS.SCHOOL_YEAR_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        false
      );
    });

    it('should return empty array when teacher has no groups', async () => {
      vi.mocked(mockRepository.findByTeacherIdAndSchoolYearId).mockResolvedValue([]);

      const result = await useCase.execute({
        teacherId: TEST_CONSTANTS.TEACHER_ID,
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      expect(result).toEqual([]);
      expect(mockRepository.findByTeacherIdAndSchoolYearId).toHaveBeenCalledWith(
        TEST_CONSTANTS.TEACHER_ID,
        TEST_CONSTANTS.SCHOOL_YEAR_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        false
      );
    });

    it('should include deleted groups when includeDeleted is true', async () => {
      const groups = [
        createTestGroup({ id: 'group-1', teacherId: TEST_CONSTANTS.TEACHER_ID }),
        createTestGroup({ id: 'group-2', teacherId: TEST_CONSTANTS.TEACHER_ID, deletedAt: new Date() }),
      ];

      vi.mocked(mockRepository.findByTeacherIdAndSchoolYearId).mockResolvedValue(groups);

      const result = await useCase.execute({
        teacherId: TEST_CONSTANTS.TEACHER_ID,
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        includeDeleted: true,
      });

      expect(result).toEqual(groups);
      expect(mockRepository.findByTeacherIdAndSchoolYearId).toHaveBeenCalledWith(
        TEST_CONSTANTS.TEACHER_ID,
        TEST_CONSTANTS.SCHOOL_YEAR_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        true
      );
    });

    it('should exclude deleted groups by default', async () => {
      const groups = [
        createTestGroup({ id: 'group-1', teacherId: TEST_CONSTANTS.TEACHER_ID }),
      ];

      vi.mocked(mockRepository.findByTeacherIdAndSchoolYearId).mockResolvedValue(groups);

      const result = await useCase.execute({
        teacherId: TEST_CONSTANTS.TEACHER_ID,
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        includeDeleted: false,
      });

      expect(result).toEqual(groups);
      expect(mockRepository.findByTeacherIdAndSchoolYearId).toHaveBeenCalledWith(
        TEST_CONSTANTS.TEACHER_ID,
        TEST_CONSTANTS.SCHOOL_YEAR_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        false
      );
    });
  });
});

