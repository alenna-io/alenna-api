import prisma from '../database/prisma.client';
import { PrismaTransaction } from '../database/PrismaTransaction';
import { Prisma } from '@prisma/client';
import { ISchoolYearRepository } from '../../domain/interfaces/repositories';

export class PrismaSchoolYearRepository implements ISchoolYearRepository {
  async findById(id: string, schoolId: string, tx: PrismaTransaction = prisma): Promise<Prisma.SchoolYearGetPayload<{}> | null> {
    return await tx.schoolYear.findFirst({
      where: {
        id,
        schoolId,
      },
    });
  }
}
