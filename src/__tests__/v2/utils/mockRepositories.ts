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
  IDailyGoalRepository,
  IMonthlyAssignmentRepository,
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
    findById: vi.fn() as unknown as (id: string, schoolId: string, tx?: PrismaTransaction) => Promise<Student | null>,
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
    findById: vi.fn() as unknown as (id: string, schoolId: string, tx?: PrismaTransaction) => Promise<SchoolYear | null>,
  };
}

export function createMockProjectionRepository(): IProjectionRepository {
  return {
    findActiveByStudent: vi.fn() as unknown as (studentId: string, schoolId: string, schoolYear: string) => Promise<Projection | null>,
    create: vi.fn() as unknown as (data: CreateProjectionInput, tx?: PrismaTransaction) => Promise<Projection>,
    findManyBySchoolId: vi.fn() as unknown as (schoolId: string, schoolYear?: string, tx?: PrismaTransaction) => Promise<any>,
    findById: vi.fn() as unknown as (id: string, schoolId: string, tx?: PrismaTransaction) => Promise<any>,
    movePace: vi.fn() as unknown as (projectionId: string, paceId: string, quarter: string, week: number, tx?: PrismaTransaction) => Promise<any>,
    addPace: vi.fn() as unknown as (projectionId: string, paceCatalogId: string, quarter: string, week: number, tx?: PrismaTransaction) => Promise<any>,
    restorePace: vi.fn() as unknown as (paceId: string, quarter: string, week: number, tx?: PrismaTransaction) => Promise<any>,
    deletePace: vi.fn() as unknown as (projectionId: string, paceId: string, tx?: PrismaTransaction) => Promise<void>,
    updateGrade: vi.fn() as unknown as (projectionId: string, paceId: string, grade: number, tx?: PrismaTransaction) => Promise<any>,
    markUngraded: vi.fn() as unknown as (projectionId: string, paceId: string, tx?: PrismaTransaction) => Promise<any>,
    addSubject: vi.fn() as unknown as (projectionId: string, subjectId: string, tx?: PrismaTransaction) => Promise<any>,
  };
}

export function createMockDailyGoalRepository(): IDailyGoalRepository {
  return {
    findDailyGoalsByWeek: vi.fn() as unknown as (projectionId: string, quarter: string, week: number, tx?: PrismaTransaction) => Promise<any[]>,
    create: vi.fn() as unknown as (projectionId: string, subject: string, quarter: string, week: number, dayOfWeek: number, text: string, tx?: PrismaTransaction) => Promise<any>,
    findById: vi.fn() as unknown as (dailyGoalId: string, schoolId: string, tx?: PrismaTransaction) => Promise<any>,
    updateNote: vi.fn() as unknown as (dailyGoalId: string, notes: string, schoolId: string, tx?: PrismaTransaction) => Promise<any>,
    markComplete: vi.fn() as unknown as (dailyGoalId: string, isCompleted: boolean, schoolId: string, tx?: PrismaTransaction) => Promise<any>,
  };
}

export function createMockProjectionPaceRepository(): IProjectionPaceRepository {
  return {
    createMany: vi.fn() as unknown as (data: Prisma.ProjectionPaceCreateManyInput[], tx?: PrismaTransaction) => Promise<void>,
  };
}

export function createMockPaceCatalogRepository(): IPaceCatalogRepository {
  return {
    findById: vi.fn() as unknown as (id: string, tx?: PrismaTransaction) => Promise<any>,
    findByCodeAndSubjectId: vi.fn() as unknown as (code: string, subjectId: string, tx?: PrismaTransaction) => Promise<PaceCatalog | null>,
    findByCodesAndSubjects: vi.fn() as unknown as (codes: string[], subjectIds: string[], tx?: PrismaTransaction) => Promise<Map<string, PaceCatalog>>,
    findByCategoryAndOrderRange: vi.fn() as unknown as (categoryId: string, startPace: number, endPace: number, subjectId: string, tx?: PrismaTransaction) => Promise<Prisma.PaceCatalogGetPayload<{ include: { subject: true } }>[]>,
    findByCategory: vi.fn() as unknown as (categoryName: string, tx?: PrismaTransaction) => Promise<any[]>,
  };
}

export function createMockSubjectRepository(): ISubjectRepository {
  return {
    findById: vi.fn() as unknown as (id: string) => Promise<Subject | null>,
    findManyByIds: vi.fn() as unknown as (ids: string[]) => Promise<Subject[]>,
    findBySubjectAndNextLevelsWithPaces: vi.fn() as unknown as (subjectId: string, levelsCount: number) => Promise<Prisma.SubjectGetPayload<{ include: { paces: true; level: true } }>[]>,
  };
}

export function createMockCategoryRepository(): ICategoryRepository {
  return {
    findManyByIds: vi.fn() as unknown as (ids: string[]) => Promise<Category[]>,
    findAllWithSubjects: vi.fn() as unknown as () => Promise<Category[]>,
    assertContiguousPaceRange: vi.fn() as unknown as (categoryId: string, startPace: number, endPace: number) => Promise<void>,
  };
}

export function createMockMonthlyAssignmentRepository(): IMonthlyAssignmentRepository {
  return {
    createTemplate: vi.fn() as unknown as (schoolYearId: string, schoolId: string, input: any, tx?: PrismaTransaction) => Promise<any>,
    findTemplatesBySchoolYear: vi.fn() as unknown as (schoolYearId: string, tx?: PrismaTransaction) => Promise<any[]>,
    updateTemplate: vi.fn() as unknown as (templateId: string, schoolId: string, input: any, tx?: PrismaTransaction) => Promise<any>,
    deleteTemplate: vi.fn() as unknown as (templateId: string, schoolId: string, tx?: PrismaTransaction) => Promise<void>,
    createPercentage: vi.fn() as unknown as (schoolYearId: string, schoolId: string, input: any, tx?: PrismaTransaction) => Promise<any>,
    findPercentagesBySchoolYear: vi.fn() as unknown as (schoolYearId: string, tx?: PrismaTransaction) => Promise<any[]>,
    updatePercentage: vi.fn() as unknown as (percentageId: string, schoolId: string, input: any, tx?: PrismaTransaction) => Promise<any>,
    findByProjection: vi.fn() as unknown as (projectionId: string, tx?: PrismaTransaction) => Promise<any[]>,
    updateGrade: vi.fn() as unknown as (projectionId: string, monthlyAssignmentId: string, grade: number, tx?: PrismaTransaction) => Promise<any>,
    markUngraded: vi.fn() as unknown as (projectionId: string, monthlyAssignmentId: string, tx?: PrismaTransaction) => Promise<any>,
    hasTemplateAssignmentsWithGrades: vi.fn() as unknown as (templateId: string, tx?: PrismaTransaction) => Promise<boolean>,
  };
}