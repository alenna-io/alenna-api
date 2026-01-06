import { ProjectionRepository } from '../../../../adapters_interface/repositories/v2';
import { Projection } from '../../../../domain/entities/v2/Projection';
import { CreateProjectionInput } from '../../../../app/dtos/v2/projections/CreateProjectionInput';
import prisma from '../../prisma.client';
import { PrismaTransaction } from '../../PrismaTransaction';

export class PrismaProjectionRepository implements ProjectionRepository {

  async findActiveByStudent(
    studentId: string,
    schoolId: string,
    schoolYear: string,
    tx: PrismaTransaction = prisma
  ): Promise<Projection | null> {
    const record = await tx.projection.findFirst({
      where: {
        studentId,
        schoolId,
        schoolYear,
        status: 'OPEN',
      },
    });

    return record
      ? new Projection(
        record.id,
        record.studentId,
        record.schoolId,
        record.schoolYear,
        record.status,
        record.createdAt,
        record.updatedAt
      )
      : null;
  }

  async create(
    { studentId, schoolId, schoolYear }: CreateProjectionInput,
    tx: PrismaTransaction = prisma
  ): Promise<Projection> {
    const record = await tx.projection.create({
      data: {
        studentId,
        schoolId,
        schoolYear
      },
    });

    return new Projection(
      record.id,
      record.studentId,
      record.schoolId,
      record.schoolYear,
      record.status,
      record.createdAt,
      record.updatedAt
    );
  }
}
