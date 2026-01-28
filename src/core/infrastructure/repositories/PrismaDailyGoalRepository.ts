import { IDailyGoalRepository } from '../../domain/interfaces/repositories/IDailyGoalRepository';
import prisma from '../database/prisma.client';
import { PrismaTransaction } from '../database/PrismaTransaction';
import { Prisma } from '@prisma/client';

export class PrismaDailyGoalRepository implements IDailyGoalRepository {
  async findDailyGoalsByWeek(
    projectionId: string,
    quarter: string,
    week: number,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.DailyGoalGetPayload<{}>[]> {
    return await tx.dailyGoal.findMany({
      where: {
        projectionId,
        quarter,
        week,
        deletedAt: null,
      },
      orderBy: [
        { subject: 'asc' },
        { dayOfWeek: 'asc' },
      ],
    });
  }
}
