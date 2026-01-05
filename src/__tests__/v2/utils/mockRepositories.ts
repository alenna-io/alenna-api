import { vi } from 'vitest';
import { StudentRepository, SchoolRepository, SchoolYearRepository, ProjectionRepository } from '../../../core/adapters_interface/repositories/v2';
import { Student } from '../../../core/domain/entities/v2/Student';
import { School } from '../../../core/domain/entities/v2/School';
import { SchoolYear } from '../../../core/domain/entities/v2/SchoolYear';
import { Projection } from '../../../core/domain/entities/v2/Projection';

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