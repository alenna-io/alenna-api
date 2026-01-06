import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GenerateProjectionUseCase } from '../../../../core/app/use-cases/projections/v2/GenerateProjectionUseCase';
import { ObjectAlreadyExistsError } from '../../../../core/app/errors/v2/ObjectAlreadyExistsError';
import { InvalidEntityError } from '../../../../core/app/errors/v2';

import {
  createMockStudentRepository,
  createMockSchoolRepository,
  createMockSchoolYearRepository,
  createMockProjectionRepository,
  createMockPaceCatalogRepository,
  createMockProjectionPaceRepository,
  createMockSubSubjectRepository,
} from '../../utils/mockRepositories';

import { createMockProjectionGenerator } from '../../utils/mockProjectionGenerator';

import { Student, StudentStatusEnum } from '../../../../core/domain/entities/v2/Student';
import { School } from '../../../../core/domain/entities/v2/School';
import { SchoolYear, SchoolYearStatusEnum } from '../../../../core/domain/entities/v2/SchoolYear';
import { Projection, ProjectionStatusEnum } from '../../../../core/domain/entities/v2/Projection';
import { PaceCatalog } from '../../../../core/domain/entities/v2/PaceCatalog';

describe('GenerateProjectionUseCase', () => {
  let studentRepo: ReturnType<typeof createMockStudentRepository>;
  let schoolRepo: ReturnType<typeof createMockSchoolRepository>;
  let schoolYearRepo: ReturnType<typeof createMockSchoolYearRepository>;
  let projectionRepo: ReturnType<typeof createMockProjectionRepository>;
  let projectionPaceRepo: ReturnType<typeof createMockProjectionPaceRepository>;
  let paceCatalogRepo: ReturnType<typeof createMockPaceCatalogRepository>;
  let subSubjectRepo: ReturnType<typeof createMockSubSubjectRepository>;
  let projectionGenerator: ReturnType<typeof createMockProjectionGenerator>;
  let useCase: GenerateProjectionUseCase;

  beforeEach(() => {
    studentRepo = createMockStudentRepository();
    schoolRepo = createMockSchoolRepository();
    schoolYearRepo = createMockSchoolYearRepository();
    projectionRepo = createMockProjectionRepository();
    projectionPaceRepo = createMockProjectionPaceRepository();
    paceCatalogRepo = createMockPaceCatalogRepository();
    subSubjectRepo = createMockSubSubjectRepository();
    projectionGenerator = createMockProjectionGenerator();

    useCase = new GenerateProjectionUseCase(
      projectionRepo,
      studentRepo,
      schoolRepo,
      schoolYearRepo,
      projectionPaceRepo,
      paceCatalogRepo,
      subSubjectRepo,
      projectionGenerator
    );
  });

  const student = new Student(
    'student-1',
    'user-1',
    'school-1',
    new Date(),
    new Date(),
    StudentStatusEnum.ENROLLED,
    'cert-1'
  );

  const school = new School('school-1', true, 'School 1');

  const schoolYear = new SchoolYear(
    'sy-1',
    'school-1',
    '2025',
    new Date(),
    new Date(),
    SchoolYearStatusEnum.CURRENT_YEAR
  );

  const projection = new Projection(
    'proj-1',
    student.id,
    school.id,
    schoolYear.id,
    ProjectionStatusEnum.OPEN,
    new Date(),
    new Date()
  );

  const subjectsInput = [
    {
      subSubjectId: 'sub-1',
      subSubjectName: 'Math',
      startPace: 1,
      endPace: 3,
      skipPaces: [],
      notPairWith: [],
    },
  ];

  const subSubjectsDB = [
    {
      id: 'sub-1',
      name: 'Math',
      difficulty: 3,
      categoryId: 'cat-1',
      levelId: 'lvl-1',
    },
  ];

  const paceCatalogMap: Map<string, PaceCatalog> = new Map([
    ['sub-1:1', { id: 'pc-1' }],
    ['sub-1:2', { id: 'pc-2' }],
    ['sub-1:3', { id: 'pc-3' }],
  ] as any);

  it('creates projection successfully and persists generated paces', async () => {
    vi.mocked(studentRepo.findById).mockResolvedValue(student);
    vi.mocked(schoolRepo.findById).mockResolvedValue(school);
    vi.mocked(schoolYearRepo.findById).mockResolvedValue(schoolYear);
    vi.mocked(projectionRepo.findActiveByStudent).mockResolvedValue(null);
    vi.mocked(projectionRepo.create).mockResolvedValue(projection);
    vi.mocked(subSubjectRepo.findManyByIds).mockResolvedValue(subSubjectsDB);
    vi.mocked(paceCatalogRepo.findByCodesAndSubSubjects).mockResolvedValue(paceCatalogMap);

    vi.mocked(projectionGenerator.generate).mockReturnValue([
      {
        subSubjectId: 'sub-1',
        paceCode: '1',
        quarter: 1,
        week: 1,
      },
    ]);

    const result = await useCase.execute({
      studentId: student.id,
      schoolId: school.id,
      schoolYear: schoolYear.id,
      subjects: subjectsInput,
    });

    expect(result).toBe(projection);
    expect(projectionGenerator.generate).toHaveBeenCalledOnce();
    expect(projectionPaceRepo.createMany).toHaveBeenCalledOnce();
  });

  it('throws ObjectAlreadyExistsError if projection already exists', async () => {
    vi.mocked(studentRepo.findById).mockResolvedValue(student);
    vi.mocked(schoolRepo.findById).mockResolvedValue(school);
    vi.mocked(schoolYearRepo.findById).mockResolvedValue(schoolYear);
    vi.mocked(projectionRepo.findActiveByStudent).mockResolvedValue(projection);

    await expect(
      useCase.execute({
        studentId: student.id,
        schoolId: school.id,
        schoolYear: schoolYear.id,
        subjects: subjectsInput,
      })
    ).rejects.toThrow(ObjectAlreadyExistsError);
  });

  it('throws InvalidEntityError when no subjects are provided', async () => {
    vi.mocked(studentRepo.findById).mockResolvedValue(student);
    vi.mocked(schoolRepo.findById).mockResolvedValue(school);
    vi.mocked(schoolYearRepo.findById).mockResolvedValue(schoolYear);
    vi.mocked(projectionRepo.findActiveByStudent).mockResolvedValue(null);

    await expect(
      useCase.execute({
        studentId: student.id,
        schoolId: school.id,
        schoolYear: schoolYear.id,
        subjects: [],
      })
    ).rejects.toThrow(InvalidEntityError);
  });
});
