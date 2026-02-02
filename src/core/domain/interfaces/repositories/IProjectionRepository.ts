import { PrismaTransaction } from '../../../infrastructure/database/PrismaTransaction';
import { Prisma } from '@prisma/client';
import { CreateProjectionInput } from '../../../application/dtos/projections/CreateProjectionInput';
import { ProjectionWithStudent, ProjectionWithDetails } from '../../../infrastructure/repositories/types/projections.types';

export interface IProjectionRepository {
  findActiveByStudent(studentId: string, schoolId: string, schoolYear: string, tx?: PrismaTransaction): Promise<Prisma.ProjectionGetPayload<{}> | null>;
  create(data: CreateProjectionInput, tx?: PrismaTransaction): Promise<Prisma.ProjectionGetPayload<{}>>;
  findManyBySchoolId(schoolId: string, schoolYear?: string, tx?: PrismaTransaction): Promise<ProjectionWithStudent[]>;
  findById(id: string, schoolId: string, tx?: PrismaTransaction): Promise<ProjectionWithDetails | null>;
  movePace(projectionId: string, paceId: string, quarter: string, week: number, tx?: PrismaTransaction): Promise<Prisma.ProjectionPaceGetPayload<{}>>;
  addPace(projectionId: string, paceCatalogId: string, quarter: string, week: number, tx?: PrismaTransaction): Promise<Prisma.ProjectionPaceGetPayload<{}>>;
  restorePace(paceId: string, quarter: string, week: number, tx?: PrismaTransaction): Promise<Prisma.ProjectionPaceGetPayload<{}>>;
  deletePace(projectionId: string, paceId: string, tx?: PrismaTransaction): Promise<void>;
  updateGrade(projectionId: string, paceId: string, grade: number, tx?: PrismaTransaction): Promise<Prisma.ProjectionPaceGetPayload<{}>>;
  markUngraded(projectionId: string, paceId: string, tx?: PrismaTransaction): Promise<Prisma.ProjectionPaceGetPayload<{}>>;
  addSubject(projectionId: string, subjectId: string, tx?: PrismaTransaction): Promise<Prisma.ProjectionSubjectGetPayload<{}>>;
} 