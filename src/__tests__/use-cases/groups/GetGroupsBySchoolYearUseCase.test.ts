import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetGroupsBySchoolYearUseCase } from '../../../core/app/use-cases/deprecated/groups/GetGroupsBySchoolYearUseCase';
import { createMockGroupRepository } from '../../utils/mockRepositories';
import { createTestGroup, TEST_CONSTANTS } from '../../utils/testHelpers';

describe('GetGroupsBySchoolYearUseCase', () => {
  let useCase: GetGroupsBySchoolYearUseCase;
  let mockRepository: ReturnType<typeof createMockGroupRepository>;

  beforeEach(() => {
    mockRepository = createMockGroupRepository();
    useCase = new GetGroupsBySchoolYearUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return groups for school year', async () => {
      const groups = [
        createTestGroup({ id: 'group-1', name: 'Group 1' }),
        createTestGroup({ id: 'group-2', name: 'Group 2' }),
      ];

      vi.mocked(mockRepository.findBySchoolYearId).mockResolvedValue(groups);

      const result = await useCase.execute({
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      expect(result).toEqual(groups);
      expect(mockRepository.findBySchoolYearId).toHaveBeenCalledWith(
        TEST_CONSTANTS.SCHOOL_YEAR_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        false
      );
    });

    it('should return empty array when no groups exist', async () => {
      vi.mocked(mockRepository.findBySchoolYearId).mockResolvedValue([]);

      const result = await useCase.execute({
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      expect(result).toEqual([]);
      expect(mockRepository.findBySchoolYearId).toHaveBeenCalledWith(
        TEST_CONSTANTS.SCHOOL_YEAR_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        false
      );
    });

    it('should include deleted groups when includeDeleted is true', async () => {
      const groups = [
        createTestGroup({ id: 'group-1' }),
        createTestGroup({ id: 'group-2', deletedAt: new Date() }),
      ];

      vi.mocked(mockRepository.findBySchoolYearId).mockResolvedValue(groups);

      const result = await useCase.execute({
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        includeDeleted: true,
      });

      expect(result).toEqual(groups);
      expect(mockRepository.findBySchoolYearId).toHaveBeenCalledWith(
        TEST_CONSTANTS.SCHOOL_YEAR_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        true
      );
    });

    it('should exclude deleted groups by default', async () => {
      const groups = [createTestGroup({ id: 'group-1' })];

      vi.mocked(mockRepository.findBySchoolYearId).mockResolvedValue(groups);

      const result = await useCase.execute({
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        includeDeleted: false,
      });

      expect(result).toEqual(groups);
      expect(mockRepository.findBySchoolYearId).toHaveBeenCalledWith(
        TEST_CONSTANTS.SCHOOL_YEAR_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        false
      );
    });
  });
});

