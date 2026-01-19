import prisma from '../database/prisma.client';
import { PrismaTransaction } from '../database/PrismaTransaction';
import { Prisma } from '@prisma/client';
import { ISchoolRepository } from '../../domain/interfaces/repositories';

export class PrismaSchoolRepository implements ISchoolRepository {
  async findById(id: string, tx: PrismaTransaction = prisma): Promise<Prisma.SchoolGetPayload<{}> | null> {
    return await tx.school.findUnique({
      where: { id },
    });
  }
}
