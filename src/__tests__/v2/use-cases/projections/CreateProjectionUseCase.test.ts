import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../../core/infrastructure/database/prisma.client', () => ({
  default: {
    $transaction: vi.fn(),
  },
}));

import { CreateProjectionUseCase } from '../../../../core/application/use-cases/projections/CreateProjectionUseCase';
import { ObjectAlreadyExistsError } from '../../../../core/domain/errors';
import { InvalidEntityError } from '../../../../core/domain/errors';
import prisma from '../../../../core/infrastructure/database/prisma.client';
import {
  createMockStudentRepository,
  createMockSchoolRepository,
  createMockSchoolYearRepository,
  createMockProjectionRepository,
  createMockMonthlyAssignmentRepository,
} from '../../utils/mockRepositories';
import {
  SchoolYear,
  SchoolYearStatus,
  Student,
  Projection,
  ProjectionStatus,
  School,
  SchoolStatus,
} from '@prisma/client';

describe('CreateProjectionUseCase', () => {
  let studentRepo: ReturnType<typeof createMockStudentRepository>;
  let schoolRepo: ReturnType<typeof createMockSchoolRepository>;
  let schoolYearRepo: ReturnType<typeof createMockSchoolYearRepository>;
  let projectionRepo: ReturnType<typeof createMockProjectionRepository>;
  let monthlyAssignmentRepo: ReturnType<typeof createMockMonthlyAssignmentRepository>;
  let useCase: CreateProjectionUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    studentRepo = createMockStudentRepository();
    schoolRepo = createMockSchoolRepository();
    schoolYearRepo = createMockSchoolYearRepository();
    projectionRepo = createMockProjectionRepository();
    monthlyAssignmentRepo = createMockMonthlyAssignmentRepository();

    useCase = new CreateProjectionUseCase(
      projectionRepo,
      studentRepo,
      schoolRepo,
      schoolYearRepo,
      monthlyAssignmentRepo
    );
  });

  it('creates a projection successfully', async () => {
    const student: Student = {
      id: 'clh1234567890abcdefghijkl',
      userId: 'clh0987654321zyxwvutsrqpo',
      schoolId: 'clh1111111111111111111111',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const school: School = {
      id: 'clh1111111111111111111111',
      name: 'School 1',
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
    };
    const schoolYear: SchoolYear = {
      id: 'clh2222222222222222222222',
      schoolId: 'clh1111111111111111111111',
      name: 'School Year 1',
      startDate: new Date(),
      endDate: new Date(),
      status: SchoolYearStatus.CURRENT_YEAR,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const projection: Projection = {
      id: 'clh3333333333333333333333',
      studentId: student.id,
      schoolId: school.id,
      schoolYear: schoolYear.id,
      status: ProjectionStatus.OPEN,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(studentRepo.findById).mockResolvedValue(student);
    vi.mocked(schoolRepo.findById).mockResolvedValue(school);
    vi.mocked(schoolYearRepo.findById).mockResolvedValue(schoolYear);
    vi.mocked(projectionRepo.findActiveByStudent).mockResolvedValue(null);
    vi.mocked(monthlyAssignmentRepo.findTemplatesBySchoolYear).mockResolvedValue([]);

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const mockTx = {
        projection: {
          create: vi.fn().mockResolvedValue(projection),
        },
        projectionMonthlyAssignment: {
          createMany: vi.fn().mockResolvedValue(undefined),
        },
      };
      // Mock the repository create to return the projection
      vi.mocked(projectionRepo.create).mockResolvedValue(projection);
      return await callback(mockTx as any);
    });

    const result = await useCase.execute({ studentId: student.id, schoolId: school.id, schoolYear: schoolYear.id });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(projection);
    }
  });

  it('returns Err when student does not exist', async () => {
    const studentId = 'clh1234567890abcdefghijkl';
    const schoolId = 'clh1111111111111111111111';
    const schoolYear = 'clh2222222222222222222222';

    vi.mocked(studentRepo.findById).mockResolvedValue(null);

    const result = await useCase.execute({ studentId, schoolId, schoolYear });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(InvalidEntityError);
      expect(result.error.message).toBe('Student not found; cannot create projection.');
    }
  });

  it('returns Err when projection exists', async () => {
    const student: Student = {
      id: 'clh1234567890abcdefghijkl',
      userId: 'clh0987654321zyxwvutsrqpo',
      schoolId: 'clh1111111111111111111111',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const school: School = {
      id: 'clh1111111111111111111111',
      name: 'School 1',
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
    };
    const schoolYear: SchoolYear = {
      id: 'clh2222222222222222222222',
      schoolId: 'clh1111111111111111111111',
      name: 'School Year 1',
      startDate: new Date(),
      endDate: new Date(),
      status: SchoolYearStatus.CURRENT_YEAR,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const projection: Projection = {
      id: 'clh3333333333333333333333',
      studentId: student.id,
      schoolId: school.id,
      schoolYear: schoolYear.id,
      status: ProjectionStatus.OPEN,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(studentRepo.findById).mockResolvedValue(student);
    vi.mocked(schoolRepo.findById).mockResolvedValue(school);
    vi.mocked(schoolYearRepo.findById).mockResolvedValue(schoolYear);
    vi.mocked(projectionRepo.findActiveByStudent).mockResolvedValue(projection);

    const result = await useCase.execute({ studentId: student.id, schoolId: school.id, schoolYear: schoolYear.id });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ObjectAlreadyExistsError);
      expect(result.error.message).toBe('A projection already exists for this student in this school year.');
    }
  });

  it('returns Err when student belongs to different school (tenant isolation)', async () => {
    const studentId = 'clh1234567890abcdefghijkl';
    const differentSchoolId = 'clh9999999999999999999999';
    const schoolYear = 'clh2222222222222222222222';

    vi.mocked(studentRepo.findById).mockResolvedValue(null); // Repository returns null when schoolId doesn't match

    const result = await useCase.execute({ studentId, schoolId: differentSchoolId, schoolYear });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(InvalidEntityError);
      expect(result.error.message).toBe('Student not found; cannot create projection.');
    }
    expect(studentRepo.findById).toHaveBeenCalledWith(studentId, differentSchoolId);
  });
});