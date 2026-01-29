import prisma from '../database/prisma.client';
import { PrismaTransaction } from '../database/PrismaTransaction';
import { Prisma, SchoolYearStatus } from '@prisma/client';
import { ISchoolRepository } from '../../domain/interfaces/repositories';

export class PrismaSchoolRepository implements ISchoolRepository {
  async findById(id: string, tx: PrismaTransaction = prisma): Promise<Prisma.SchoolGetPayload<{}> | null> {
    return await tx.school.findUnique({
      where: { id },
    });
  }

  async findSchoolWithCurrentYearByUserId(userId: string, tx: PrismaTransaction = prisma): Promise<Prisma.SchoolGetPayload<{}> | null> {
    return await tx.school.findFirst({
      where: {
        users: {
          some: { id: userId },
        },
      },
      include: {
        schoolYears: {
          where: {
            status: SchoolYearStatus.CURRENT_YEAR,
          },
          include: {
            quarters: {
              include: {
                schoolWeeks: {
                  where: {
                    deletedAt: null,
                  },
                  orderBy: {
                    weekNumber: 'asc',
                  },
                },
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });
  }
}
