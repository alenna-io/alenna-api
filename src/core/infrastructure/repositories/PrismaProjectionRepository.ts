import { CreateProjectionInput } from '../../application/dtos/projections/CreateProjectionInput';
import prisma from '../database/prisma.client';
import { PrismaTransaction } from '../database/PrismaTransaction';
import { Prisma } from '@prisma/client';
import { IProjectionRepository } from '../../domain/interfaces/repositories';

export class PrismaProjectionRepository implements IProjectionRepository {

  async findActiveByStudent(
    studentId: string,
    schoolId: string,
    schoolYear: string,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.ProjectionGetPayload<{}> | null> {
    return await tx.projection.findFirst({
      where: {
        studentId,
        schoolId,
        schoolYear,
        status: 'OPEN',
      },
    });
  }

  async create(
    { studentId, schoolId, schoolYear }: CreateProjectionInput,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.ProjectionGetPayload<{}>> {
    return await tx.projection.create({
      data: {
        studentId,
        schoolId,
        schoolYear
      },
    });
  }
}
