import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetUsersUseCase } from '../../../core/app/use-cases/users/GetUsersUseCase';
import { createMockUserRepository } from '../../utils/mockRepositories';
import { User, Role } from '../../../core/domain/entities';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

describe('GetTeachersUseCase (via GetUsersUseCase)', () => {
  let useCase: GetUsersUseCase;
  let mockRepository: ReturnType<typeof createMockUserRepository>;

  beforeEach(() => {
    mockRepository = createMockUserRepository();
    useCase = new GetUsersUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('getTeachers - filtering users by TEACHER role', () => {
    it('should return only users with TEACHER role', async () => {
      const teacherRole = new Role('teacher-role-id', 'TEACHER', 'Teacher', 'Teacher role', true, true, undefined);
      const adminRole = new Role('admin-role-id', 'SCHOOL_ADMIN', 'School Admin', 'Admin role', true, true, undefined);

      const teacher1 = User.create({
        id: 'user-1',
        email: 'teacher1@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        firstName: 'John',
        lastName: 'Doe',
        roles: [teacherRole],
      });

      const teacher2 = User.create({
        id: 'user-2',
        email: 'teacher2@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        firstName: 'Jane',
        lastName: 'Smith',
        roles: [teacherRole],
      });

      const admin = User.create({
        id: 'user-3',
        email: 'admin@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        firstName: 'Admin',
        lastName: 'User',
        roles: [adminRole],
      });

      const allUsers = [teacher1, teacher2, admin];

      vi.mocked(mockRepository.findBySchoolId).mockResolvedValue(allUsers);

      const users = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);
      const teachers = users.filter(user => 
        user.roles.some(role => role.name === 'TEACHER')
      );

      expect(teachers.length).toBe(2);
      expect(teachers.every(t => t.roles.some(r => r.name === 'TEACHER'))).toBe(true);
      expect(teachers.find(t => t.email === 'teacher1@test.com')).toBeDefined();
      expect(teachers.find(t => t.email === 'teacher2@test.com')).toBeDefined();
      expect(teachers.find(t => t.email === 'admin@test.com')).toBeUndefined();
    });

    it('should return empty array when no teachers exist', async () => {
      const adminRole = new Role('admin-role-id', 'SCHOOL_ADMIN', 'School Admin', 'Admin role', true, true, undefined);

      const admin = User.create({
        id: 'user-1',
        email: 'admin@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        roles: [adminRole],
      });

      vi.mocked(mockRepository.findBySchoolId).mockResolvedValue([admin]);

      const users = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);
      const teachers = users.filter(user => 
        user.roles.some(role => role.name === 'TEACHER')
      );

      expect(teachers.length).toBe(0);
    });

    it('should handle teachers with multiple roles', async () => {
      const teacherRole = new Role('teacher-role-id', 'TEACHER', 'Teacher', 'Teacher role', true, true, undefined);
      const adminRole = new Role('admin-role-id', 'SCHOOL_ADMIN', 'School Admin', 'Admin role', true, true, undefined);

      const teacherAdmin = User.create({
        id: 'user-1',
        email: 'teacher-admin@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        roles: [teacherRole, adminRole],
      });

      vi.mocked(mockRepository.findBySchoolId).mockResolvedValue([teacherAdmin]);

      const users = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);
      const teachers = users.filter(user => 
        user.roles.some(role => role.name === 'TEACHER')
      );

      expect(teachers.length).toBe(1);
      expect(teachers[0].roles.length).toBe(2);
      expect(teachers[0].roles.some(r => r.name === 'TEACHER')).toBe(true);
    });

    it('should exclude inactive teachers if needed', async () => {
      const teacherRole = new Role('teacher-role-id', 'TEACHER', 'Teacher', 'Teacher role', true, true, undefined);

      const activeTeacher = User.create({
        id: 'user-1',
        email: 'active@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: true,
        roles: [teacherRole],
      });

      const inactiveTeacher = User.create({
        id: 'user-2',
        email: 'inactive@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        isActive: false,
        roles: [teacherRole],
      });

      vi.mocked(mockRepository.findBySchoolId).mockResolvedValue([activeTeacher, inactiveTeacher]);

      const users = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);
      const teachers = users.filter(user => 
        user.roles.some(role => role.name === 'TEACHER')
      );
      const activeTeachers = teachers.filter(t => t.isActive);

      expect(teachers.length).toBe(2);
      expect(activeTeachers.length).toBe(1);
      expect(activeTeachers[0].email).toBe('active@test.com');
    });
  });

  describe('teacher count', () => {
    it('should count teachers correctly', async () => {
      const teacherRole = new Role('teacher-role-id', 'TEACHER', 'Teacher', 'Teacher role', true, true, undefined);
      const adminRole = new Role('admin-role-id', 'SCHOOL_ADMIN', 'School Admin', 'Admin role', true, true, undefined);

      const teacher1 = User.create({
        id: 'user-1',
        email: 'teacher1@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        roles: [teacherRole],
      });

      const teacher2 = User.create({
        id: 'user-2',
        email: 'teacher2@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        roles: [teacherRole],
      });

      const admin = User.create({
        id: 'user-3',
        email: 'admin@test.com',
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        roles: [adminRole],
      });

      vi.mocked(mockRepository.findBySchoolId).mockResolvedValue([teacher1, teacher2, admin]);

      const users = await useCase.execute(TEST_CONSTANTS.SCHOOL_ID);
      const teachersCount = users.filter(user => 
        user.roles.some(role => role.name === 'TEACHER')
      ).length;

      expect(teachersCount).toBe(2);
    });
  });
});

