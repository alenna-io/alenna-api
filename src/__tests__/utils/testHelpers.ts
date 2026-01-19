import { Student, CertificationType, User, Group, GroupStudent, MonthlyAssignment, DailyGoal } from '../../core/domain/entities/deprecated';
import { CreateStudentInput } from '../../core/app/dtos';

/**
 * Creates a test Student entity with default values
 * Override specific properties as needed
 */
export function createTestStudent(overrides?: Partial<Student>): Student {
  const defaultCertificationType = new CertificationType(
    'cert-1',
    'Test Certification',
    'school-1'
  );

  const defaultStudent = Student.create({
    id: 'student-1',
    firstName: 'John',
    lastName: 'Doe',
    age: 15,
    birthDate: new Date('2010-01-01'),
    certificationTypeId: 'cert-1',
    certificationType: defaultCertificationType,
    graduationDate: new Date('2028-06-01'),
    schoolId: 'school-1',
    isLeveled: false,
    parents: [],
  });

  if (!overrides) {
    return defaultStudent;
  }

  // Merge overrides
  return new Student(
    overrides.id ?? defaultStudent.id,
    overrides.firstName ?? defaultStudent.firstName,
    overrides.lastName ?? defaultStudent.lastName,
    overrides.age ?? defaultStudent.age,
    overrides.birthDate ?? defaultStudent.birthDate,
    overrides.certificationTypeId ?? defaultStudent.certificationTypeId,
    overrides.certificationType ?? defaultStudent.certificationType,
    overrides.graduationDate ?? defaultStudent.graduationDate,
    overrides.schoolId ?? defaultStudent.schoolId,
    overrides.isActive ?? defaultStudent.isActive,
    overrides.isLeveled ?? defaultStudent.isLeveled,
    overrides.expectedLevel ?? defaultStudent.expectedLevel,
    overrides.currentLevel ?? defaultStudent.currentLevel,
    overrides.parents ?? defaultStudent.parents,
    overrides.createdAt ?? defaultStudent.createdAt,
    overrides.updatedAt ?? defaultStudent.updatedAt
  );
}

/**
 * Creates test CreateStudentInput with default values
 */
export function createTestCreateStudentInput(
  overrides?: Partial<CreateStudentInput>
): CreateStudentInput {
  return {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    birthDate: '2010-01-01T00:00:00.000Z',
    certificationTypeId: 'cert-1',
    graduationDate: '2028-06-01T00:00:00.000Z',
    isLeveled: false,
    parents: [
      {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phone: '123-456-7890',
        relationship: 'Mother',
      },
    ],
    ...overrides,
  };
}

/**
 * Creates a test CertificationType entity
 */
export function createTestCertificationType(
  overrides?: Partial<CertificationType>
): CertificationType {
  return new CertificationType(
    overrides?.id ?? 'cert-1',
    overrides?.name ?? 'Test Certification',
    overrides?.schoolId ?? 'school-1',
    overrides?.description,
    overrides?.isActive ?? true,
    overrides?.createdAt,
    overrides?.updatedAt
  );
}

/**
 * Creates a test User entity with default values
 * Override specific properties as needed
 */
export function createTestUser(overrides?: Partial<User>): User {
  const defaultUser = User.create({
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    schoolId: 'school-1',
    clerkId: 'clerk-user-1',
    isActive: true,
  });

  if (!overrides) {
    return defaultUser;
  }

  // Merge overrides - User constructor: id, clerkId, email, schoolId, firstName?, lastName?, phone?, language?, isActive, createdPassword, roles, createdAt?, updatedAt?
  return new User(
    overrides.id ?? defaultUser.id,
    overrides.clerkId ?? defaultUser.clerkId,
    overrides.email ?? defaultUser.email,
    overrides.schoolId ?? defaultUser.schoolId,
    overrides.firstName ?? defaultUser.firstName,
    overrides.lastName ?? defaultUser.lastName,
    overrides.phone ?? defaultUser.phone,
    overrides.language ?? defaultUser.language,
    overrides.isActive ?? defaultUser.isActive,
    overrides.createdPassword ?? defaultUser.createdPassword,
    overrides.roles ?? defaultUser.roles,
    overrides.userStudents ?? defaultUser.userStudents,
    overrides.createdAt ?? defaultUser.createdAt,
    overrides.updatedAt ?? defaultUser.updatedAt
  );
}

/**
 * Creates a test ProjectionTemplate with default values
 */
export function createTestProjectionTemplate(overrides?: {
  id?: string;
  name?: string;
  level?: string;
  isDefault?: boolean;
  isActive?: boolean;
  schoolId?: string;
  templateSubjects?: Array<{
    id?: string;
    subSubjectId?: string;
    subSubjectName?: string;
    startPace?: number;
    endPace?: number;
    skipPaces?: number[];
    notPairWith?: string[];
    extendToNext?: boolean;
    order?: number;
  }>;
}): any {
  const defaultTemplate = {
    id: 'template-1',
    name: 'Plantilla L1',
    level: 'L1',
    isDefault: true,
    isActive: true,
    schoolId: TEST_CONSTANTS.SCHOOL_ID,
    templateSubjects: [
      {
        id: 'subject-1',
        subSubjectId: 'sub-subject-1',
        subSubjectName: 'Math L1',
        startPace: 1001,
        endPace: 1012,
        skipPaces: [],
        notPairWith: [],
        extendToNext: false,
        order: 0,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    ...defaultTemplate,
    ...overrides,
    templateSubjects: overrides?.templateSubjects || defaultTemplate.templateSubjects,
  };
}

/**
 * Creates a test Group entity with default values
 */
export function createTestGroup(overrides?: Partial<Group>): Group {
  const defaultGroup = Group.create({
    id: 'group-1',
    teacherId: 'teacher-1',
    schoolYearId: 'school-year-1',
    schoolId: TEST_CONSTANTS.SCHOOL_ID,
    name: 'Test Group',
  });

  if (!overrides) {
    return defaultGroup;
  }

  return new Group(
    overrides.id ?? defaultGroup.id,
    overrides.name ?? defaultGroup.name,
    overrides.teacherId ?? defaultGroup.teacherId,
    overrides.schoolYearId ?? defaultGroup.schoolYearId,
    overrides.schoolId ?? defaultGroup.schoolId,
    overrides.deletedAt ?? defaultGroup.deletedAt,
    overrides.createdAt ?? defaultGroup.createdAt,
    overrides.updatedAt ?? defaultGroup.updatedAt
  );
}

/**
 * Creates a test GroupStudent entity with default values
 */
export function createTestGroupStudent(overrides?: Partial<GroupStudent>): GroupStudent {
  const defaultGroupStudent = GroupStudent.create({
    id: 'group-student-1',
    groupId: 'group-1',
    studentId: TEST_CONSTANTS.STUDENT_ID,
  });

  if (!overrides) {
    return defaultGroupStudent;
  }

  return new GroupStudent(
    overrides.id ?? defaultGroupStudent.id,
    overrides.groupId ?? defaultGroupStudent.groupId,
    overrides.studentId ?? defaultGroupStudent.studentId,
    overrides.deletedAt ?? defaultGroupStudent.deletedAt,
    overrides.createdAt ?? defaultGroupStudent.createdAt,
    overrides.updatedAt ?? defaultGroupStudent.updatedAt
  );
}

/**
 * Creates a test MonthlyAssignment entity with default values
 */
export function createTestMonthlyAssignment(overrides?: Partial<MonthlyAssignment>): MonthlyAssignment {
  const defaultAssignment = new MonthlyAssignment(
    'assignment-1',
    'projection-1',
    'Test Assignment',
    'Q1',
    null,
    new Date(),
    new Date(),
    undefined
  );

  if (!overrides) {
    return defaultAssignment;
  }

  return new MonthlyAssignment(
    overrides.id ?? defaultAssignment.id,
    overrides.projectionId ?? defaultAssignment.projectionId,
    overrides.name ?? defaultAssignment.name,
    overrides.quarter ?? defaultAssignment.quarter,
    overrides.grade ?? defaultAssignment.grade,
    overrides.createdAt ?? defaultAssignment.createdAt,
    overrides.updatedAt ?? defaultAssignment.updatedAt,
    overrides.deletedAt ?? defaultAssignment.deletedAt
  );
}

/**
 * Common test constants
 */
export const TEST_CONSTANTS = {
  SCHOOL_ID: 'school-1',
  USER_ID: 'user-1',
  STUDENT_ID: 'student-1',
  CERTIFICATION_TYPE_ID: 'cert-1',
  CLERK_ID: 'clerk-user-1',
  TEMPLATE_ID: 'template-1',
  TEACHER_ID: 'teacher-1',
  SCHOOL_YEAR_ID: 'school-year-1',
  GROUP_ID: 'group-1',
  PROJECTION_ID: 'projection-1',
  ASSIGNMENT_ID: 'assignment-1',
  DAILY_GOAL_ID: 'daily-goal-1',
} as const;

/**
 * Creates a test DailyGoal entity with default values
 */
export function createTestDailyGoal(overrides?: Partial<DailyGoal>): DailyGoal {
  const defaultGoal = DailyGoal.create({
    id: 'daily-goal-1',
    projectionId: TEST_CONSTANTS.PROJECTION_ID,
    subject: 'Math',
    quarter: 'Q1',
    week: 1,
    dayOfWeek: 1,
    text: '45-67',
  });

  if (!overrides) {
    return defaultGoal;
  }

  return new DailyGoal(
    overrides.id ?? defaultGoal.id,
    overrides.projectionId ?? defaultGoal.projectionId,
    overrides.subject ?? defaultGoal.subject,
    overrides.quarter ?? defaultGoal.quarter,
    overrides.week ?? defaultGoal.week,
    overrides.dayOfWeek ?? defaultGoal.dayOfWeek,
    overrides.text ?? defaultGoal.text,
    overrides.isCompleted ?? defaultGoal.isCompleted,
    overrides.notes ?? defaultGoal.notes,
    overrides.notesCompleted ?? defaultGoal.notesCompleted,
    overrides.deletedAt ?? defaultGoal.deletedAt,
    overrides.createdAt ?? defaultGoal.createdAt,
    overrides.updatedAt ?? defaultGoal.updatedAt
  );
}

