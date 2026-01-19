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

    expect(result).toEqual(projection);
  });

  it('throws InvalidEntityError if student does not exist', async () => {
    const studentId = 's1';
    const schoolId = 'school1';
    const schoolYear = 'sy1';

    vi.mocked(studentRepo.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({ studentId, schoolId, schoolYear })
    ).rejects.toThrow(InvalidEntityError);
  });

  it('throws ObjectAlreadyExistsError if projection exists', async () => {
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


    await expect(
      useCase.execute({ studentId: student.id, schoolId: school.id, schoolYear: schoolYear.id })
    ).rejects.toThrow(ObjectAlreadyExistsError);
  });
});
