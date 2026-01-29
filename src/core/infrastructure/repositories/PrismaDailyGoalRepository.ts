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

  async create(
    projectionId: string,
    subject: string,
    quarter: string,
    week: number,
    dayOfWeek: number,
    text: string,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.DailyGoalGetPayload<{}>> {
    return await tx.dailyGoal.create({
      data: {
        projectionId,
        subject,
        quarter,
        week,
        dayOfWeek,
        text,
        isCompleted: false,
        notes: null,
        notesCompleted: false,
      },
    });
  }

  async findById(
    dailyGoalId: string,
    schoolId: string,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.DailyGoalGetPayload<{}> | null> {
    return await tx.dailyGoal.findFirst({
      where: {
        id: dailyGoalId,
        deletedAt: null,
        projection: {
          schoolId,
        },
      },
    });
  }

  async updateNote(
    dailyGoalId: string,
    notes: string,
    schoolId: string,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.DailyGoalGetPayload<{}>> {
    return await tx.dailyGoal.update({
      where: {
        id: dailyGoalId,
        deletedAt: null,
        projection: {
          schoolId,
        },
      },
      data: {
        notes,
      },
    });
  }

  async markComplete(
    dailyGoalId: string,
    isCompleted: boolean,
    schoolId: string,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.DailyGoalGetPayload<{}>> {
    return await tx.dailyGoal.update({
      where: {
        id: dailyGoalId,
        deletedAt: null,
        projection: {
          schoolId,
        },
      },
      data: {
        isCompleted,
        notesCompleted: isCompleted,
      },
    });
  }
}
