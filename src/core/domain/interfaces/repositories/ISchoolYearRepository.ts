import { PrismaTransaction } from '../../../infrastructure/database/PrismaTransaction';
import { Prisma } from '@prisma/client';

export interface ISchoolYearRepository {
  findById(id: string, tx?: PrismaTransaction): Promise<Prisma.SchoolYearGetPayload<{}> | null>;
} 