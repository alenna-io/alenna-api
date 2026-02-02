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
  createMockMonthlyAssignmentRepository,
} from '../../utils/mockRepositories';

import { createMockProjectionGenerator } from '../../utils/mockProjectionGenerator';

import {
  Student,
  School,
  SchoolYear,
  Projection,
  PaceCatalog,
  SchoolYearStatus,
  ProjectionStatus,
  Prisma,
  SchoolStatus,
} from '@prisma/client';

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
  let monthlyAssignmentRepo: ReturnType<typeof createMockMonthlyAssignmentRepository>;
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
    monthlyAssignmentRepo = createMockMonthlyAssignmentRepository();

    useCase = new GenerateProjectionUseCase(
      projectionRepo,
      studentRepo,
      schoolRepo,
      schoolYearRepo,
      projectionPaceRepo,
      paceCatalogRepo as any,
      subjectRepo,
      categoryRepo as any,
      projectionGenerator,
      monthlyAssignmentRepo
    );
  });

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
    name: '2025',
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

  const subjectsInput = [
    {
      categoryId: 'clh4444444444444444444444',
      subjectId: 'clh5555555555555555555555',
      startPace: 1,
      endPace: 3,
      skipPaces: [],
      notPairWith: [],
    },
  ];

  const subSubjectsDB = [
    {
      id: 'clh5555555555555555555555',
      name: 'Math',
      difficulty: 3,
      categoryId: 'clh4444444444444444444444',
      levelId: 'clh6666666666666666666666',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const paceCatalogMap: Map<string, PaceCatalog> = new Map([
    ['clh4444444444444444444444:1', {
      id: 'clh7777777777777777777777',
      code: '1',
      name: 'Pace 1',
      orderIndex: 1,
      subjectId: 'clh5555555555555555555555',
      categoryId: 'clh4444444444444444444444',
      createdAt: new Date(),
      updatedAt: new Date(),
    }],
    ['clh4444444444444444444444:2', {
      id: 'clh8888888888888888888888',
      code: '2',
      name: 'Pace 2',
      orderIndex: 2,
      subjectId: 'clh5555555555555555555555',
      categoryId: 'clh4444444444444444444444',
      createdAt: new Date(),
      updatedAt: new Date(),
    }],
    ['clh4444444444444444444444:3', {
      id: 'clh9999999999999999999999',
      code: '3',
      name: 'Pace 3',
      orderIndex: 3,
      subjectId: 'clh5555555555555555555555',
      categoryId: 'clh4444444444444444444444',
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
    vi.mocked(categoryRepo.findManyByIds).mockResolvedValue([{ id: 'clh4444444444444444444444', name: 'Category 1', description: null, displayOrder: 0, createdAt: new Date(), updatedAt: new Date() }]);
    vi.mocked(categoryRepo.assertContiguousPaceRange).mockResolvedValue(undefined);
    const paceCatalogsWithSubject: Prisma.PaceCatalogGetPayload<{ include: { subject: true } }>[] = [
      {
        ...paceCatalogMap.get('clh4444444444444444444444:1')!,
        subject: subSubjectsDB[0],
      },
      {
        ...paceCatalogMap.get('clh4444444444444444444444:2')!,
        subject: subSubjectsDB[0],
      },
      {
        ...paceCatalogMap.get('clh4444444444444444444444:3')!,
        subject: subSubjectsDB[0],
      },
    ] as any;
    vi.mocked(paceCatalogRepo.findByCategoryAndOrderRange).mockResolvedValue(paceCatalogsWithSubject);
    vi.mocked(subjectRepo.findManyByIds).mockResolvedValue(subSubjectsDB);
    vi.mocked(projectionPaceRepo.createMany).mockResolvedValue(undefined);

    vi.mocked(projectionGenerator.generate).mockReturnValue([
      {
        categoryId: 'clh4444444444444444444444',
        subjectId: 'clh5555555555555555555555',
        paceCode: '1',
        quarter: 1,
        week: 1,
      },
    ]);

    vi.mocked(monthlyAssignmentRepo.findTemplatesBySchoolYear).mockResolvedValue([]);

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const mockTx = {
        projection: {
          create: vi.fn().mockResolvedValue(projection),
        },
        projectionSubject: {
          createMany: vi.fn().mockResolvedValue(undefined),
        },
        projectionMonthlyAssignment: {
          createMany: vi.fn().mockResolvedValue(undefined),
        },
      };
      return await callback(mockTx as any);
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