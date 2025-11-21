import { Group, GroupStudent } from '../../domain/entities';

export interface IGroupRepository {
  // Get all active groups for a school year
  findBySchoolYearId(schoolYearId: string, schoolId: string, includeDeleted?: boolean): Promise<Group[]>;
  
  // Get all groups for a teacher in a school year
  findByTeacherIdAndSchoolYearId(teacherId: string, schoolYearId: string, schoolId: string, includeDeleted?: boolean): Promise<Group[]>;
  
  // Get a specific group by ID
  findById(id: string, schoolId: string): Promise<Group | null>;
  
  // Find a group by teacher, school year, and name (or null for default groups)
  findByTeacherSchoolYearAndName(teacherId: string, schoolYearId: string, schoolId: string, name: string | null, includeDeleted?: boolean): Promise<Group | null>;
  
  // Create a new group
  create(teacherId: string, schoolYearId: string, schoolId: string, name?: string | null): Promise<Group>;
  
  // Update a group (e.g., change name)
  update(id: string, schoolId: string, data: Partial<Pick<Group, 'name'>>): Promise<Group>;
  
  // Soft delete a group (preserves historical data)
  delete(id: string, schoolId: string): Promise<void>;
  
  // Get all students in a group
  getGroupStudents(groupId: string, schoolId: string, includeDeleted?: boolean): Promise<GroupStudent[]>;
  
  // Add a student to a group
  addStudentToGroup(groupId: string, studentId: string, schoolId: string): Promise<GroupStudent>;
  
  // Remove a student from a group (soft delete)
  removeStudentFromGroup(groupId: string, studentId: string, schoolId: string): Promise<void>;
  
  // Add multiple students to a group
  addStudentsToGroup(groupId: string, studentIds: string[], schoolId: string): Promise<GroupStudent[]>;
  
  // Check if a group exists (for validation)
  exists(teacherId: string, schoolYearId: string, name: string | null): Promise<boolean>;
  
  // Check if a student is already in a group for this school year
  isStudentInGroupForSchoolYear(studentId: string, schoolYearId: string, excludeGroupId?: string): Promise<boolean>;

  // Get all student assignments for a school year (returns studentId -> groupId mappings)
  getStudentAssignmentsForSchoolYear(schoolYearId: string, schoolId: string): Promise<Array<{ studentId: string; groupId: string }>>;
}

