import { vi } from 'vitest';
import {
  IStudentRepository,
  ISchoolRepository,
  ISchoolYearRepository,
  IProjectionRepository,
  IProjectionPaceRepository,
  IPaceCatalogRepository,
  ISubjectRepository,
  ICategoryRepository,
} from '../../../core/domain/interfaces/repositories';
import {
  Prisma,
  Student,
  School,
  SchoolYear,
  Projection,
  PaceCatalog,
  Subject,
  Category,
} from '@prisma/client';
import { PrismaTransaction } from '../../../core/infrastructure/database/PrismaTransaction';
import { CreateProjectionInput } from '../../../core/application/dtos/projections/CreateProjectionInput';


export function createMockStudentRepository(): IStudentRepository {
  return {
    findById: vi.fn() as unknown as (id: string) => Promise<Student | null>,
    findEnrolledWithoutOpenProjectionBySchoolId: vi.fn() as unknown as (schoolId: string) => Promise<Student[]>,
  };
}

export function createMockSchoolRepository(): ISchoolRepository {
  return {
    findById: vi.fn() as unknown as (id: string) => Promise<School | null>,
    findSchoolWithCurrentYearByUserId: vi.fn() as unknown as (userId: string) => Promise<School | null>,
  };
}

export function createMockSchoolYearRepository(): ISchoolYearRepository {
  return {
    findById: vi.fn() as unknown as (id: string) => Promise<SchoolYear | null>,
  };
}

export function createMockProjectionRepository(): IProjectionRepository {
  return {
    findActiveByStudent: vi.fn() as unknown as (studentId: string, schoolId: string, schoolYear: string) => Promise<Projection | null>,
    create: vi.fn() as unknown as (data: CreateProjectionInput, tx?: PrismaTransaction) => Promise<Projection>,
  };
}

export function createMockProjectionPaceRepository(): IProjectionPaceRepository {
  return {
    createMany: vi.fn() as unknown as (data: Prisma.ProjectionPaceCreateManyInput[], tx?: PrismaTransaction) => Promise<void>,
  };
}

export function createMockPaceCatalogRepository(): IPaceCatalogRepository {
  return {
    findByCodeAndSubjectId: vi.fn() as unknown as (code: string, subjectId: string) => Promise<PaceCatalog | null>,
    findByCodesAndSubjects: vi.fn() as unknown as (codes: string[], subjectIds: string[]) => Promise<Map<string, PaceCatalog>>,
    findByCategoryAndOrderRange: vi.fn() as unknown as (categoryId: string, startPace: number, endPace: number) => Promise<Prisma.PaceCatalogGetPayload<{ include: { subject: true } }>[]>,
  };
}

export function createMockSubjectRepository(): ISubjectRepository {
  return {
    findById: vi.fn() as unknown as (id: string) => Promise<Subject | null>,
    findManyByIds: vi.fn() as unknown as (ids: string[]) => Promise<Subject[]>,
    findBySubjectAndNextLevelsWithPaces: vi.fn() as unknown as (subjectId: string, levelsCount: number) => Promise<Prisma.SubjectGetPayload<{ include: { paces: true } }>[]>,
  };
}

export function createMockCategoryRepository(): ICategoryRepository {
  return {
    findManyByIds: vi.fn() as unknown as (ids: string[]) => Promise<Category[]>,
    findAllWithSubjects: vi.fn() as unknown as () => Promise<Category[]>,
    assertContiguousPaceRange: vi.fn() as unknown as (categoryId: string, startPace: number, endPace: number) => Promise<void>,
  };
}