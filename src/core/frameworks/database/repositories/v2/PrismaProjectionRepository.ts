import { ProjectionRepository } from '../../../../adapters_interface/repositories/v2/ProjectionRepository';
import { Projection } from '../../../../domain/entities/v2/Projection';
import { CreateProjectionInput } from '../../../../app/dtos/v2/projections/CreateProjectionInput';
import prisma from '../../prisma.client';

export class PrismaProjectionRepository
  implements ProjectionRepository {

  async findActiveByStudent(studentId: string, schoolId: string, schoolYear: string): Promise<Projection | null> {
    const record = await prisma.projection.findFirst({
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

  async create({ studentId, schoolId, schoolYear }: CreateProjectionInput): Promise<Projection> {
    const record = await prisma.projection.create({
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
