export type RoleName = 'SUPERADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT';

export type ModuleKey = 'students' | 'users' | 'schools' | 'configuration';

export interface PermissionDefinition {
  module: ModuleKey;
  scope: 'global' | 'school' | 'own';
}

export const PERMISSION_DEFINITIONS: Record<string, PermissionDefinition> = {
  // Students & related submodules
  'students.read': { module: 'students', scope: 'school' },
  'students.readOwn': { module: 'students', scope: 'own' },
  'students.create': { module: 'students', scope: 'school' },
  'students.update': { module: 'students', scope: 'school' },
  'students.delete': { module: 'students', scope: 'school' },

  'projections.read': { module: 'students', scope: 'school' },
  'projections.readOwn': { module: 'students', scope: 'own' },
  'projections.create': { module: 'students', scope: 'school' },
  'projections.update': { module: 'students', scope: 'school' },
  'projections.delete': { module: 'students', scope: 'school' },

  'reportCards.read': { module: 'students', scope: 'school' },
  'reportCards.readOwn': { module: 'students', scope: 'own' },

  'paces.read': { module: 'students', scope: 'school' },
  'paces.create': { module: 'students', scope: 'school' },
  'paces.update': { module: 'students', scope: 'school' },
  'paces.delete': { module: 'students', scope: 'school' },
  'paces.move': { module: 'students', scope: 'school' },

  // Users module
  'users.read': { module: 'users', scope: 'school' },
  'users.create': { module: 'users', scope: 'school' },
  'users.update': { module: 'users', scope: 'school' },
  'users.delete': { module: 'users', scope: 'school' },

  // Schools module (superadmin)
  'schools.read': { module: 'schools', scope: 'global' },
  'schools.create': { module: 'schools', scope: 'global' },
  'schools.update': { module: 'schools', scope: 'global' },
  'schools.delete': { module: 'schools', scope: 'global' },

  // Configuration module
  'schoolInfo.read': { module: 'configuration', scope: 'school' },
  'schoolInfo.update': { module: 'configuration', scope: 'global' },
  'schoolYear.read': { module: 'configuration', scope: 'school' },
  'schoolYear.create': { module: 'configuration', scope: 'school' },
  'schoolYear.update': { module: 'configuration', scope: 'school' },
  'schoolYear.delete': { module: 'configuration', scope: 'school' },

  // Monthly Assignments (school-level)
  'monthlyAssignment.read': { module: 'configuration', scope: 'school' },
  'monthlyAssignment.create': { module: 'configuration', scope: 'school' },
  'monthlyAssignment.update': { module: 'configuration', scope: 'school' },
  'monthlyAssignment.delete': { module: 'configuration', scope: 'school' },
};

export const ROLE_PERMISSION_MAP: Record<RoleName, string[]> = {
  SUPERADMIN: Object.keys(PERMISSION_DEFINITIONS),
  SCHOOL_ADMIN: [
    'students.read',
    'students.create',
    'students.update',
    'students.delete',
    'projections.read',
    'projections.create',
    'projections.update',
    'projections.delete',
    'reportCards.read',
    'paces.read',
    'paces.create',
    'paces.update',
    'paces.delete',
    'paces.move',
    'users.read',
    'users.create',
    'schools.read',
    'schoolInfo.read',
    'schoolYear.read',
    'schoolYear.create',
    'schoolYear.update',
    'schoolYear.delete',
    'monthlyAssignment.read',
    'monthlyAssignment.create',
    'monthlyAssignment.update',
    'monthlyAssignment.delete',
  ],
  TEACHER: [
    'students.read',
    'students.create',
    'students.update',
    'students.delete',
    'projections.read',
    'projections.create',
    'projections.update',
    'projections.delete',
    'reportCards.read',
    'paces.read',
    'paces.create',
    'paces.update',
    'paces.delete',
    'paces.move',
    'schoolInfo.read',
    'schoolYear.read',
    'monthlyAssignment.read',
    'monthlyAssignment.create',
    'monthlyAssignment.update',
    'monthlyAssignment.delete',
  ],
  PARENT: [
    'students.readOwn',
    'projections.readOwn',
    'reportCards.readOwn',
    'paces.read',
  ],
  STUDENT: [
    'students.readOwn',
    'projections.readOwn',
    'reportCards.readOwn',
  ],
};

export const MODULE_KEY_TO_DB_KEY: Record<ModuleKey, string> = {
  students: 'students',
  users: 'users',
  schools: 'schools',
  configuration: 'configuration',
};
