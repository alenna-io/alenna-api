import { PrismaTransaction } from '../../../infrastructure/database/PrismaTransaction';
import { Prisma } from '@prisma/client';

export interface IDailyGoalRepository {
  findDailyGoalsByWeek(
    projectionId: string,
    quarter: string,
    week: number,
    tx?: PrismaTransaction
  ): Promise<Prisma.DailyGoalGetPayload<{}>[]>;
  create(
    projectionId: string,
    subject: string,
    quarter: string,
    week: number,
    dayOfWeek: number,
    text: string,
    tx?: PrismaTransaction
  ): Promise<Prisma.DailyGoalGetPayload<{}>>;
  findById(dailyGoalId: string, schoolId: string, tx?: PrismaTransaction): Promise<Prisma.DailyGoalGetPayload<{}> | null>;
  updateNote(
    dailyGoalId: string,
    notes: string,
    schoolId: string,
    tx?: PrismaTransaction
  ): Promise<Prisma.DailyGoalGetPayload<{}>>;
  markComplete(
    dailyGoalId: string,
    isCompleted: boolean,
    schoolId: string,
    tx?: PrismaTransaction
  ): Promise<Prisma.DailyGoalGetPayload<{}>>;
}
