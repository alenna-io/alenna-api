import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateProjectionUseCase } from '../../../../core/application/use-cases/projections/CreateProjectionUseCase';
import { ObjectAlreadyExistsError } from '../../../../core/domain/errors';
import { InvalidEntityError } from '../../../../core/domain/errors';
import {
  createMockStudentRepository,
  createMockSchoolRepository,
  createMockSchoolYearRepository,
  createMockProjectionRepository,
} from '../../utils/mockRepositories';
import {
  SchoolYear,
  SchoolYearStatus,
  Student,
  Projection,
  ProjectionStatus,
  School,
} from '@prisma/client';

describe('CreateProjectionUseCase', () => {
  let studentRepo: ReturnType<typeof createMockStudentRepository>;
  let schoolRepo: ReturnType<typeof createMockSchoolRepository>;
  let schoolYearRepo: ReturnType<typeof createMockSchoolYearRepository>;
  let projectionRepo: ReturnType<typeof createMockProjectionRepository>;
  let useCase: CreateProjectionUseCase;

  beforeEach(() => {
    studentRepo = createMockStudentRepository();
    schoolRepo = createMockSchoolRepository();
    schoolYearRepo = createMockSchoolYearRepository();
    projectionRepo = createMockProjectionRepository();

    useCase = new CreateProjectionUseCase(
      projectionRepo,
      studentRepo,
      schoolRepo,
      schoolYearRepo
    );
  });

  it('creates a projection successfully', async () => {
    const student: Student = {
      id: 's1',
      userId: 'user1',
      schoolId: 'school1',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const school: School = {
      id: 'school1',
      name: 'School 1',
      address: null,
      phone: null,
      email: null,
      logoUrl: null,
      teacherLimit: null,
      userLimit: null,
      isActive: true,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const schoolYear: SchoolYear = {
      id: 'sy1',
      schoolId: 'school1',
      name: 'School Year 1',
      startDate: new Date(),
      endDate: new Date(),
      status: SchoolYearStatus.CURRENT_YEAR,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const projection: Projection = {
      id: 'p1',
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
    vi.mocked(projectionRepo.create).mockResolvedValue(projection);

    const result = await useCase.execute({ studentId: 's1', schoolId: 'school1', schoolYear: 'sy1' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(projection);
    }
  });

  it('returns Err when student does not exist', async () => {
    const studentId = 's1';
    const schoolId = 'school1';
    const schoolYear = 'sy1';

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
      id: 's1',
      userId: 'user1',
      schoolId: 'school1',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const school: School = {
      id: 'school1',
      name: 'School 1',
      address: null,
      phone: null,
      email: null,
      logoUrl: null,
      teacherLimit: null,
      userLimit: null,
      isActive: true,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const schoolYear: SchoolYear = {
      id: 'sy1',
      schoolId: 'school1',
      name: 'School Year 1',
      startDate: new Date(),
      endDate: new Date(),
      status: SchoolYearStatus.CURRENT_YEAR,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const projection: Projection = {
      id: 'p1',
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
});