import prisma from '../database/prisma.client';
import { PrismaTransaction } from '../database/PrismaTransaction';
import { Prisma } from '@prisma/client';
import { ISubjectRepository } from '../../domain/interfaces/repositories';

export class PrismaSubjectRepository implements ISubjectRepository {
  async findById(id: string, tx: PrismaTransaction = prisma): Promise<Prisma.SubjectGetPayload<{}> | null> {
    return await tx.subject.findUnique({
      where: { id },
    });
  }

  async findManyByIds(ids: string[], tx: PrismaTransaction = prisma): Promise<Prisma.SubjectGetPayload<{}>[]> {
    return await tx.subject.findMany({
      where: { id: { in: ids } },
    });
  }
}
