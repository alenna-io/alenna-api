import { PrismaTransaction } from '../database/PrismaTransaction';
import prisma from '../database/prisma.client';
import { Prisma } from '@prisma/client';
import { IProjectionPaceRepository } from '../../domain/interfaces/repositories';

export class PrismaProjectionPaceRepository implements IProjectionPaceRepository {
  async createMany(
    data: Prisma.ProjectionPaceCreateManyInput[],
    tx: PrismaTransaction = prisma
  ): Promise<void> {
    await tx.projectionPace.createMany({
      data,
    });
  }
}
