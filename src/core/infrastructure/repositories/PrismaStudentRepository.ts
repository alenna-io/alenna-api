import prisma from '../database/prisma.client';
import { PrismaTransaction } from '../database/PrismaTransaction';
import { Prisma } from '@prisma/client';

export class PrismaStudentRepository {
  async findById(id: string, tx: PrismaTransaction = prisma): Promise<Prisma.StudentGetPayload<{}> | null> {
    return await tx.student.findUnique({
      where: {
        id,
      },
    });
  }
}
