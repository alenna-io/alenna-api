export const RoleTypes = {
  SUPERADMIN: 'SUPERADMIN',
  SCHOOL_ADMIN: 'SCHOOL_ADMIN',
  TEACHER: 'TEACHER',
  PARENT: 'PARENT',
  STUDENT: 'STUDENT',
} as const;

export type RoleType = (typeof RoleTypes)[keyof typeof RoleTypes];
