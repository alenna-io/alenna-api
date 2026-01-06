import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateProjectionUseCase } from '../../../../core/app/use-cases/projections/v2/CreateProjectionUseCase';
import { ObjectAlreadyExistsError } from '../../../../core/app/errors/v2/ObjectAlreadyExistsError';
import { InvalidEntityError } from '../../../../core/app/errors/v2';
import { SchoolYear, SchoolYearStatusEnum } from '../../../../core/domain/entities/v2/SchoolYear';
import { createMockStudentRepository, createMockSchoolRepository, createMockSchoolYearRepository, createMockProjectionRepository } from '../../utils/mockRepositories';
import { Student, StudentStatusEnum } from '../../../../core/domain/entities/v2/Student';
import { Projection, ProjectionStatusEnum } from '../../../../core/domain/entities/v2/Projection';
import { School } from '../../../../core/domain/entities/v2/School';

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
    const student = new Student('s1', 'user1', 'school1', new Date(), new Date(), StudentStatusEnum.ENROLLED, 'certification1');
    const school = new School('school1', true, 'School 1');
    const schoolYear = new SchoolYear('sy1', 'school1', 'School Year 1', new Date(), new Date(), SchoolYearStatusEnum.CURRENT_YEAR);
    const projection = new Projection('p1', student.id, school.id, schoolYear.id, ProjectionStatusEnum.OPEN, new Date(), new Date());


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
    const student = new Student('s1', 'user1', 'school1', new Date(), new Date(), StudentStatusEnum.ENROLLED, 'certification1');
    const school = new School('school1', true, 'School 1');
    const schoolYear = new SchoolYear('sy1', 'school1', 'School Year 1', new Date(), new Date(), SchoolYearStatusEnum.CURRENT_YEAR);
    const projection = new Projection('p1', student.id, school.id, schoolYear.id, ProjectionStatusEnum.OPEN, new Date(), new Date());

    vi.mocked(studentRepo.findById).mockResolvedValue(student);
    vi.mocked(schoolRepo.findById).mockResolvedValue(school);
    vi.mocked(schoolYearRepo.findById).mockResolvedValue(schoolYear);
    vi.mocked(projectionRepo.findActiveByStudent).mockResolvedValue(projection);


    await expect(
      useCase.execute({ studentId: student.id, schoolId: school.id, schoolYear: schoolYear.id })
    ).rejects.toThrow(ObjectAlreadyExistsError);
  });
});
