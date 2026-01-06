import { vi } from 'vitest';
import {
  StudentRepository,
  SchoolRepository,
  SchoolYearRepository,
  ProjectionRepository,
  ProjectionPaceRepository,
  PaceCatalogRepository,
  SubSubjectRepository,
} from '../../../core/adapters_interface/repositories/v2';
import { Student } from '../../../core/domain/entities/v2/Student';
import { School } from '../../../core/domain/entities/v2/School';
import { SchoolYear } from '../../../core/domain/entities/v2/SchoolYear';
import { Projection } from '../../../core/domain/entities/v2/Projection';
import { ProjectionPace } from '../../../core/domain/entities/v2/ProjectionPace';
import { PaceCatalog } from '../../../core/domain/entities/v2/PaceCatalog';
import { SubSubject } from '../../../core/domain/entities/v2/SubSubject';

export function createMockStudentRepository(): StudentRepository {
  return {
    findById: vi.fn() as unknown as (id: string) => Promise<Student | null>,
  };
}

export function createMockSchoolRepository(): SchoolRepository {
  return {
    findById: vi.fn() as unknown as (id: string) => Promise<School | null>,
  };
}

export function createMockSchoolYearRepository(): SchoolYearRepository {
  return {
    findById: vi.fn() as unknown as (id: string) => Promise<SchoolYear | null>,
  };
}

export function createMockProjectionRepository(): ProjectionRepository {
  return {
    findActiveByStudent: vi.fn() as unknown as (studentId: string, schoolId: string, schoolYear: string) => Promise<Projection | null>,
    create: vi.fn() as unknown as (projection: Projection) => Promise<Projection>,
  };
}

export function createMockProjectionPaceRepository(): ProjectionPaceRepository {
  return {
    createMany: vi.fn() as unknown as (projectionPaces: ProjectionPace[]) => Promise<ProjectionPace[]>,
  };
}

export function createMockPaceCatalogRepository(): PaceCatalogRepository {
  return {
    findByCodeAndSubSubjectId: vi.fn() as unknown as (code: string, subSubjectId: string) => Promise<PaceCatalog | null>,
    findByCodesAndSubSubjects: vi.fn() as unknown as (codes: string[], subSubjectIds: string[]) => Promise<Map<string, PaceCatalog>>,
  };
}

export function createMockSubSubjectRepository(): SubSubjectRepository {
  return {
    findById: vi.fn() as unknown as (id: string) => Promise<SubSubject | null>,
    findManyByIds: vi.fn() as unknown as (ids: string[]) => Promise<SubSubject[]>,
  };
}