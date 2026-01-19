import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../../core/infrastructure/database/prisma.client', () => ({
  default: {
    $transaction: vi.fn(),
  },
}));

import { GenerateProjectionUseCase } from '../../../../core/application/use-cases/projections/GenerateProjectionUseCase';
import { ObjectAlreadyExistsError, InvalidEntityError } from '../../../../core/domain/errors';
import prisma from '../../../../core/infrastructure/database/prisma.client';

import {
  createMockStudentRepository,
  createMockSchoolRepository,
  createMockSchoolYearRepository,
  createMockProjectionRepository,
  createMockPaceCatalogRepository,
  createMockProjectionPaceRepository,
  createMockSubjectRepository,
  createMockCategoryRepository,
} from '../../utils/mockRepositories';

import { createMockProjectionGenerator } from '../../utils/mockProjectionGenerator';

import { Student, School, SchoolYear, Projection, PaceCatalog, SchoolYearStatus, ProjectionStatus, Prisma } from '@prisma/client';

describe('GenerateProjectionUseCase', () => {
  let studentRepo: ReturnType<typeof createMockStudentRepository>;
  let schoolRepo: ReturnType<typeof createMockSchoolRepository>;
  let schoolYearRepo: ReturnType<typeof createMockSchoolYearRepository>;
  let projectionRepo: ReturnType<typeof createMockProjectionRepository>;
  let projectionPaceRepo: ReturnType<typeof createMockProjectionPaceRepository>;
  let paceCatalogRepo: ReturnType<typeof createMockPaceCatalogRepository>;
  let subjectRepo: ReturnType<typeof createMockSubjectRepository>;
  let categoryRepo: ReturnType<typeof createMockCategoryRepository>;
  let projectionGenerator: ReturnType<typeof createMockProjectionGenerator>;
  let useCase: GenerateProjectionUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    studentRepo = createMockStudentRepository();
    schoolRepo = createMockSchoolRepository();
    schoolYearRepo = createMockSchoolYearRepository();
    projectionRepo = createMockProjectionRepository();
    projectionPaceRepo = createMockProjectionPaceRepository();
    paceCatalogRepo = createMockPaceCatalogRepository();
    subjectRepo = createMockSubjectRepository();
    categoryRepo = createMockCategoryRepository();
    projectionGenerator = createMockProjectionGenerator();

    useCase = new GenerateProjectionUseCase(
      projectionRepo,
      studentRepo,
      schoolRepo,
      schoolYearRepo,
      projectionPaceRepo,
      paceCatalogRepo as any,
      subjectRepo,
      categoryRepo as any,
      projectionGenerator
    );
  });

  const student: Student = {
    id: 'student-1',
    userId: 'user-1',
    schoolId: 'school-1',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const school: School = {
    id: 'school-1',
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
    id: 'sy-1',
    schoolId: 'school-1',
    name: '2025',
    startDate: new Date(),
    endDate: new Date(),
    status: SchoolYearStatus.CURRENT_YEAR,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const projection: Projection = {
    id: 'proj-1',
    studentId: student.id,
    schoolId: school.id,
    schoolYear: schoolYear.id,
    status: ProjectionStatus.OPEN,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const subjectsInput = [
    {
      categoryId: 'cat-1',
      subjectId: 'sub-1',
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
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const paceCatalogMap: Map<string, PaceCatalog> = new Map([
    ['cat-1:1', {
      id: 'pc-1',
      code: '1',
      name: 'Pace 1',
      orderIndex: 1,
      subjectId: 'sub-1',
      categoryId: 'cat-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }],
    ['cat-1:2', {
      id: 'pc-2',
      code: '2',
      name: 'Pace 2',
      orderIndex: 2,
      subjectId: 'sub-1',
      categoryId: 'cat-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }],
    ['cat-1:3', {
      id: 'pc-3',
      code: '3',
      name: 'Pace 3',
      orderIndex: 3,
      subjectId: 'sub-1',
      categoryId: 'cat-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }],
  ] as any);

  it('creates projection successfully and persists generated paces', async () => {
    vi.mocked(studentRepo.findById).mockResolvedValue(student);
    vi.mocked(schoolRepo.findById).mockResolvedValue(school);
    vi.mocked(schoolYearRepo.findById).mockResolvedValue(schoolYear);
    vi.mocked(projectionRepo.findActiveByStudent).mockResolvedValue(null);
    vi.mocked(projectionRepo.create).mockResolvedValue(projection);
    vi.mocked(categoryRepo.findManyByIds).mockResolvedValue([{ id: 'cat-1', name: 'Category 1', description: null, displayOrder: 0, createdAt: new Date(), updatedAt: new Date() }]);
    vi.mocked(categoryRepo.assertContiguousPaceRange).mockResolvedValue(undefined);
    const paceCatalogsWithSubject: Prisma.PaceCatalogGetPayload<{ include: { subject: true } }>[] = [
      {
        ...paceCatalogMap.get('cat-1:1')!,
        subject: subSubjectsDB[0],
      },
      {
        ...paceCatalogMap.get('cat-1:2')!,
        subject: subSubjectsDB[0],
      },
      {
        ...paceCatalogMap.get('cat-1:3')!,
        subject: subSubjectsDB[0],
      },
    ] as any;
    vi.mocked(paceCatalogRepo.findByCategoryAndOrderRange).mockResolvedValue(paceCatalogsWithSubject);
    vi.mocked(subjectRepo.findManyByIds).mockResolvedValue(subSubjectsDB);
    vi.mocked(projectionPaceRepo.createMany).mockResolvedValue(undefined);

    vi.mocked(projectionGenerator.generate).mockReturnValue([
      {
        categoryId: 'cat-1',
        subjectId: 'sub-1',
        paceCode: '1',
        quarter: 1,
        week: 1,
      },
    ]);

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      return await callback({} as any);
    });

    const result = await useCase.execute({
      studentId: student.id,
      schoolId: school.id,
      schoolYear: schoolYear.id,
      subjects: subjectsInput,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(projection);
    }
    expect(projectionGenerator.generate).toHaveBeenCalledOnce();
    expect(projectionPaceRepo.createMany).toHaveBeenCalledOnce();
  });

  it('returns Err when projection already exists', async () => {
    vi.mocked(studentRepo.findById).mockResolvedValue(student);
    vi.mocked(schoolRepo.findById).mockResolvedValue(school);
    vi.mocked(schoolYearRepo.findById).mockResolvedValue(schoolYear);
    vi.mocked(projectionRepo.findActiveByStudent).mockResolvedValue(projection);

    const result = await useCase.execute({
      studentId: student.id,
      schoolId: school.id,
      schoolYear: schoolYear.id,
      subjects: subjectsInput,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ObjectAlreadyExistsError);
      expect(result.error.message).toBe('A projection already exists for this student in this school year.');
    }
  });

  it('returns Err when no subjects are provided', async () => {
    vi.mocked(studentRepo.findById).mockResolvedValue(student);
    vi.mocked(schoolRepo.findById).mockResolvedValue(school);
    vi.mocked(schoolYearRepo.findById).mockResolvedValue(schoolYear);
    vi.mocked(projectionRepo.findActiveByStudent).mockResolvedValue(null);

    const result = await useCase.execute({
      studentId: student.id,
      schoolId: school.id,
      schoolYear: schoolYear.id,
      subjects: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(InvalidEntityError);
      expect(result.error.message).toBe('At least one subject is required to generate a projection');
    }
  });
});