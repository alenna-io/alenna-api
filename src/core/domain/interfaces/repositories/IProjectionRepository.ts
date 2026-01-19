import { PrismaTransaction } from '../../../infrastructure/database/PrismaTransaction';
import { Prisma } from '@prisma/client';
import { CreateProjectionInput } from '../../../application/dtos/projections/CreateProjectionInput';

export interface IProjectionRepository {
  findActiveByStudent(studentId: string, schoolId: string, schoolYear: string, tx?: PrismaTransaction): Promise<Prisma.ProjectionGetPayload<{}> | null>;
  create(data: CreateProjectionInput, tx?: PrismaTransaction): Promise<Prisma.ProjectionGetPayload<{}>>;
} 