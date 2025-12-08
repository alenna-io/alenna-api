import { Student, CertificationType } from '../../core/domain/entities';
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
 * Common test constants
 */
export const TEST_CONSTANTS = {
  SCHOOL_ID: 'school-1',
  USER_ID: 'user-1',
  STUDENT_ID: 'student-1',
  CERTIFICATION_TYPE_ID: 'cert-1',
} as const;

