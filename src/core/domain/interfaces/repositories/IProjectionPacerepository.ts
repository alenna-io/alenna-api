import { Prisma } from '@prisma/client';
import { PrismaTransaction } from '../../../infrastructure/database/PrismaTransaction';

export interface IProjectionPaceRepository {
  createMany(data: Prisma.ProjectionPaceCreateManyInput[], tx?: PrismaTransaction): Promise<void>;
} 