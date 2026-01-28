import { PrismaTransaction } from '../../../infrastructure/database/PrismaTransaction';
import { Prisma } from '@prisma/client';

export interface IDailyGoalRepository {
  findDailyGoalsByWeek(
    projectionId: string,
    quarter: string,
    week: number,
    tx?: PrismaTransaction
  ): Promise<Prisma.DailyGoalGetPayload<{}>[]>;
}
