import { PrismaTransaction } from '../../../infrastructure/database/PrismaTransaction';
import { Prisma } from '@prisma/client';

export interface ISchoolRepository {
  findById(id: string, tx?: PrismaTransaction): Promise<Prisma.SchoolGetPayload<{}> | null>;
  findSchoolWithCurrentYearByUserId(userId: string, tx?: PrismaTransaction): Promise<Prisma.SchoolGetPayload<{}> | null>;
} 