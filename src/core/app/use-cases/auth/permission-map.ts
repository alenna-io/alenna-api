export type RoleName = 'SUPERADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT';

export type ModuleKey = 'students' | 'projections' | 'paces' | 'monthlyAssignments' | 'reportCards' | 'groups' | 'teachers' | 'school_admin' | 'schools' | 'users';

export interface PermissionDefinition {
  module: ModuleKey;
  scope: 'global' | 'school' | 'own';
}

export const PERMISSION_DEFINITIONS: Record<string, PermissionDefinition> = {
  // Students module - student personal and academic information
  'students.read': { module: 'students', scope: 'school' },
  'students.readOwn': { module: 'students', scope: 'own' },
  'students.create': { module: 'students', scope: 'school' },
  'students.update': { module: 'students', scope: 'school' },
  'students.delete': { module: 'students', scope: 'school' },

  // Projections module - academic projections
  'projections.read': { module: 'projections', scope: 'school' },
  'projections.readOwn': { module: 'projections', scope: 'own' },
  'projections.create': { module: 'projections', scope: 'school' },
  'projections.update': { module: 'projections', scope: 'school' },
  'projections.delete': { module: 'projections', scope: 'school' },

  // PACEs module - PACE catalog (read-only for now)
  'paces.read': { module: 'paces', scope: 'school' },

  // Monthly Assignments module
  'monthlyAssignment.read': { module: 'monthlyAssignments', scope: 'school' },
  'monthlyAssignment.create': { module: 'monthlyAssignments', scope: 'school' },
  'monthlyAssignment.update': { module: 'monthlyAssignments', scope: 'school' },
  'monthlyAssignment.delete': { module: 'monthlyAssignments', scope: 'school' },

  // Report Cards module
  'reportCards.read': { module: 'reportCards', scope: 'school' },
  'reportCards.readOwn': { module: 'reportCards', scope: 'own' },
  'reportCards.create': { module: 'reportCards', scope: 'school' },
  'reportCards.update': { module: 'reportCards', scope: 'school' },

  // Groups module - teacher-student assignments per school year
  'groups.read': { module: 'groups', scope: 'school' },
  'groups.create': { module: 'groups', scope: 'school' },
  'groups.update': { module: 'groups', scope: 'school' },
  'groups.delete': { module: 'groups', scope: 'school' },

  // Teachers module - teacher management
  'teachers.read': { module: 'teachers', scope: 'school' },
  'teachers.create': { module: 'teachers', scope: 'school' },
  'teachers.update': { module: 'teachers', scope: 'school' },
  'teachers.delete': { module: 'teachers', scope: 'school' },

  // School Admin module - school settings (info, years, certification types)
  'schoolInfo.read': { module: 'school_admin', scope: 'school' },
  'schoolInfo.update': { module: 'school_admin', scope: 'school' },
  'schoolYear.read': { module: 'school_admin', scope: 'school' },
  'schoolYear.create': { module: 'school_admin', scope: 'school' },
  'schoolYear.update': { module: 'school_admin', scope: 'school' },
  'schoolYear.delete': { module: 'school_admin', scope: 'school' },

  // Users module - system users (non-teacher users)
  'users.read': { module: 'users', scope: 'school' },
  'users.create': { module: 'users', scope: 'school' },
  'users.update': { module: 'users', scope: 'school' },
  'users.delete': { module: 'users', scope: 'school' },

  // Schools module - school management (superadmin only)
  'schools.read': { module: 'schools', scope: 'global' },
  'schools.create': { module: 'schools', scope: 'global' },
  'schools.update': { module: 'schools', scope: 'global' },
  'schools.delete': { module: 'schools', scope: 'global' },
};

export const ROLE_PERMISSION_MAP: Record<RoleName, string[]> = {
  SUPERADMIN: Object.keys(PERMISSION_DEFINITIONS),
  SCHOOL_ADMIN: [
    // Students
    'students.read',
    'students.create',
    'students.update',
    'students.delete',
    // Projections
    'projections.read',
    'projections.create',
    'projections.update',
    'projections.delete',
    // PACEs (read-only)
    'paces.read',
    // Monthly Assignments
    'monthlyAssignment.read',
    'monthlyAssignment.create',
    'monthlyAssignment.update',
    'monthlyAssignment.delete',
    // Report Cards
    'reportCards.read',
    'reportCards.create',
    'reportCards.update',
    // Groups
    'groups.read',
    'groups.create',
    'groups.update',
    'groups.delete',
    // Teachers
    'teachers.read',
    'teachers.create',
    'teachers.update',
    'teachers.delete',
    // School Admin
    'schoolInfo.read',
    'schoolInfo.update',
    'schoolYear.read',
    'schoolYear.create',
    'schoolYear.update',
    'schoolYear.delete',
    // Users (non-teacher users)
    'users.read',
    'users.create',
    // Schools (read-only for school admin)
    'schools.read',
  ],
  TEACHER: [
    // Students (read, update - no create/delete)
    'students.read',
    'students.update',
    // Projections
    'projections.read',
    'projections.create',
    'projections.update',
    'projections.delete',
    // PACEs (read-only)
    'paces.read',
    // Monthly Assignments
    'monthlyAssignment.read',
    'monthlyAssignment.create',
    'monthlyAssignment.update',
    'monthlyAssignment.delete',
    // Report Cards (read-only)
    'reportCards.read',
    // Groups (read-only)
    'groups.read',
    // School Admin (read-only)
    'schoolInfo.read',
    'schoolYear.read',
  ],
  PARENT: [
    // Students (own only)
    'students.readOwn',
    // Projections (own only)
    'projections.readOwn',
    // Report Cards (own only)
    'reportCards.readOwn',
    // PACEs (read-only)
    'paces.read',
  ],
  STUDENT: [
    // Students (own only)
    'students.readOwn',
    // Projections (own only)
    'projections.readOwn',
    // Report Cards (own only)
    'reportCards.readOwn',
  ],
};

export const MODULE_KEY_TO_DB_KEY: Record<ModuleKey, string> = {
  students: 'students',
  projections: 'projections',
  paces: 'paces',
  monthlyAssignments: 'monthlyAssignments',
  reportCards: 'reportCards',
  groups: 'groups',
  teachers: 'teachers',
  school_admin: 'school_admin',
  schools: 'schools',
  users: 'users',
};

/**
 * Module dependencies - child modules require parent modules to be enabled
 * Example: reportCards requires projections module to be enabled
 */
export const MODULE_DEPENDENCIES: Record<ModuleKey, ModuleKey[]> = {
  students: [],
  projections: [],
  paces: [],
  monthlyAssignments: ['projections'], // Requires projections module
  reportCards: ['projections'], // Requires projections module
  groups: [],
  teachers: [],
  school_admin: [],
  schools: [],
  users: [],
};
