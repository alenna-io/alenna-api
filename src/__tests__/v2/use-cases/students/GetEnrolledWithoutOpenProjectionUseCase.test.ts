import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetEnrolledWithoutOpenProjectionUseCase } from '../../../../core/application/use-cases/students/GetEnrolledWithoutOpenProjectionUseCase';
import { InvalidEntityError, ObjectNotFoundError } from '../../../../core/domain/errors';
import {
  createMockStudentRepository,
  createMockSchoolRepository,
} from '../../utils/mockRepositories';
import { Prisma, SchoolStatus, UserStatus } from '@prisma/client';

describe('GetEnrolledWithoutOpenProjectionUseCase', () => {
  let studentRepo: ReturnType<typeof createMockStudentRepository>;
  let schoolRepo: ReturnType<typeof createMockSchoolRepository>;
  let useCase: GetEnrolledWithoutOpenProjectionUseCase;

  beforeEach(() => {
    studentRepo = createMockStudentRepository();
    schoolRepo = createMockSchoolRepository();
    useCase = new GetEnrolledWithoutOpenProjectionUseCase(studentRepo, schoolRepo);
  });

  it('returns students without open projection successfully', async () => {
    const userId = 'clh1234567890abcdefghijkl';
    const school: Prisma.SchoolGetPayload<{ include: { schoolYears: true } }> = {
      id: 'clh1111111111111111111111',
      name: 'Test School',
      address: null,
      phone: null,
      email: null,
      logoUrl: null,
      teacherLimit: null,
      userLimit: null,
      status: SchoolStatus.ACTIVE,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      schoolYears: [],
    };

    const students: Prisma.StudentGetPayload<{ include: { user: true } }>[] = [
      {
        id: 'clh2222222222222222222222',
        userId: 'clh3333333333333333333333',
        schoolId: school.id,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'clh3333333333333333333333',
          clerkId: null,
          email: 'student1@test.com',
          firstName: 'Student',
          lastName: 'One',
          phone: null,
          streetAddress: null,
          city: null,
          state: null,
          country: null,
          zipCode: null,
          schoolId: school.id,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          language: 'es',
          status: UserStatus.ACTIVE,
          createdPassword: false,
        },
      },
    ];

    vi.mocked(schoolRepo.findSchoolWithCurrentYearByUserId).mockResolvedValue(school as any);
    vi.mocked(studentRepo.findEnrolledWithoutOpenProjectionBySchoolId).mockResolvedValue(students as any);

    const result = await useCase.execute(userId);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(students);
      expect(result.data).toHaveLength(1);
    }
    expect(schoolRepo.findSchoolWithCurrentYearByUserId).toHaveBeenCalledWith(userId);
    expect(studentRepo.findEnrolledWithoutOpenProjectionBySchoolId).toHaveBeenCalledWith(school.id);
  });

  it('returns empty array when no students found', async () => {
    const userId = 'clh1234567890abcdefghijkl';
    const school: Prisma.SchoolGetPayload<{ include: { schoolYears: true } }> = {
      id: 'clh1111111111111111111111',
      name: 'Test School',
      address: null,
      phone: null,
      email: null,
      logoUrl: null,
      teacherLimit: null,
      userLimit: null,
      status: SchoolStatus.ACTIVE,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      schoolYears: [],
    };

    vi.mocked(schoolRepo.findSchoolWithCurrentYearByUserId).mockResolvedValue(school as any);
    vi.mocked(studentRepo.findEnrolledWithoutOpenProjectionBySchoolId).mockResolvedValue([]);

    const result = await useCase.execute(userId);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
      expect(result.data).toHaveLength(0);
    }
  });

  it('returns Err when school not found', async () => {
    const userId = 'clh1234567890abcdefghijkl';

    vi.mocked(schoolRepo.findSchoolWithCurrentYearByUserId).mockResolvedValue(null);

    const result = await useCase.execute(userId);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ObjectNotFoundError);
      expect(result.error.message).toBe('School not found for this user');
    }
  });

  it('returns Err when repository throws InvalidEntityError', async () => {
    const userId = 'clh1234567890abcdefghijkl';
    const error = new InvalidEntityError('School', 'Failed to fetch school');
    vi.mocked(schoolRepo.findSchoolWithCurrentYearByUserId).mockRejectedValue(error);

    const result = await useCase.execute(userId);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(InvalidEntityError);
    }
  });

  it('re-throws unexpected errors', async () => {
    const userId = 'clh1234567890abcdefghijkl';
    const school: Prisma.SchoolGetPayload<{ include: { schoolYears: true } }> = {
      id: 'clh1111111111111111111111',
      name: 'Test School',
      address: null,
      phone: null,
      email: null,
      logoUrl: null,
      teacherLimit: null,
      userLimit: null,
      status: SchoolStatus.ACTIVE,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      schoolYears: [],
    };

    vi.mocked(schoolRepo.findSchoolWithCurrentYearByUserId).mockResolvedValue(school as any);
    const unexpectedError = new Error('Database connection failed');
    vi.mocked(studentRepo.findEnrolledWithoutOpenProjectionBySchoolId).mockRejectedValue(unexpectedError);

    await expect(useCase.execute(userId)).rejects.toThrow('Database connection failed');
  });
});
