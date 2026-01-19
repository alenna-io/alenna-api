import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateGroupUseCase } from '../../../core/app/use-cases/deprecated/groups/CreateGroupUseCase';
import { createMockGroupRepository } from '../../utils/mockRepositories';
import { createTestGroup, createTestGroupStudent, TEST_CONSTANTS } from '../../utils/testHelpers';

describe('CreateGroupUseCase', () => {
  let useCase: CreateGroupUseCase;
  let mockRepository: ReturnType<typeof createMockGroupRepository>;

  beforeEach(() => {
    mockRepository = createMockGroupRepository();
    useCase = new CreateGroupUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should create a group successfully without students', async () => {
      const group = createTestGroup();

      vi.mocked(mockRepository.create).mockResolvedValue(group);

      const result = await useCase.execute({
        teacherId: TEST_CONSTANTS.TEACHER_ID,
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: 'Test Group',
      });

      expect(result.group).toEqual(group);
      expect(result.groupStudents).toEqual([]);
      expect(mockRepository.create).toHaveBeenCalledWith(
        TEST_CONSTANTS.TEACHER_ID,
        TEST_CONSTANTS.SCHOOL_YEAR_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        'Test Group'
      );
      expect(mockRepository.addStudentsToGroup).not.toHaveBeenCalled();
    });

    it('should create a group with null name', async () => {
      const group = createTestGroup({ name: null });

      vi.mocked(mockRepository.create).mockResolvedValue(group);

      const result = await useCase.execute({
        teacherId: TEST_CONSTANTS.TEACHER_ID,
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: null,
      });

      expect(result.group).toEqual(group);
      expect(mockRepository.create).toHaveBeenCalledWith(
        TEST_CONSTANTS.TEACHER_ID,
        TEST_CONSTANTS.SCHOOL_YEAR_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        null
      );
    });

    it('should create a group and add students immediately', async () => {
      const group = createTestGroup();
      const studentIds = ['student-1', 'student-2'];
      const groupStudents = [
        createTestGroupStudent({ id: 'gs-1', studentId: 'student-1' }),
        createTestGroupStudent({ id: 'gs-2', studentId: 'student-2' }),
      ];

      vi.mocked(mockRepository.create).mockResolvedValue(group);
      vi.mocked(mockRepository.addStudentsToGroup).mockResolvedValue(groupStudents);

      const result = await useCase.execute({
        teacherId: TEST_CONSTANTS.TEACHER_ID,
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: 'Test Group',
        studentIds,
      });

      expect(result.group).toEqual(group);
      expect(result.groupStudents).toEqual(groupStudents);
      expect(mockRepository.create).toHaveBeenCalledWith(
        TEST_CONSTANTS.TEACHER_ID,
        TEST_CONSTANTS.SCHOOL_YEAR_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        'Test Group'
      );
      expect(mockRepository.addStudentsToGroup).toHaveBeenCalledWith(
        group.id,
        studentIds,
        TEST_CONSTANTS.SCHOOL_ID
      );
    });

    it('should create a group with empty studentIds array', async () => {
      const group = createTestGroup();

      vi.mocked(mockRepository.create).mockResolvedValue(group);

      const result = await useCase.execute({
        teacherId: TEST_CONSTANTS.TEACHER_ID,
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        name: 'Test Group',
        studentIds: [],
      });

      expect(result.group).toEqual(group);
      expect(result.groupStudents).toEqual([]);
      expect(mockRepository.addStudentsToGroup).not.toHaveBeenCalled();
    });

    it('should create a group without name parameter', async () => {
      const group = createTestGroup({ name: null });

      vi.mocked(mockRepository.create).mockResolvedValue(group);

      const result = await useCase.execute({
        teacherId: TEST_CONSTANTS.TEACHER_ID,
        schoolYearId: TEST_CONSTANTS.SCHOOL_YEAR_ID,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
      });

      expect(result.group).toEqual(group);
      expect(mockRepository.create).toHaveBeenCalledWith(
        TEST_CONSTANTS.TEACHER_ID,
        TEST_CONSTANTS.SCHOOL_YEAR_ID,
        TEST_CONSTANTS.SCHOOL_ID,
        undefined
      );
    });
  });
});

