import { Projection as PrismaProjection } from '@prisma/client';
import { Projection } from '../../../domain/entities';

export class ProjectionMapper {
  static toDomain(prismaProjection: PrismaProjection): Projection {
    return new Projection(
      prismaProjection.id,
      prismaProjection.studentId,
      prismaProjection.schoolYear,
      prismaProjection.startDate,
      prismaProjection.endDate,
      prismaProjection.isActive,
      prismaProjection.notes || undefined,
      prismaProjection.createdAt,
      prismaProjection.updatedAt
    );
  }

  static toPrisma(projection: Projection): Omit<PrismaProjection, 'createdAt' | 'updatedAt'> {
    return {
      id: projection.id,
      studentId: projection.studentId,
      schoolYear: projection.schoolYear,
      startDate: projection.startDate,
      endDate: projection.endDate,
      isActive: projection.isActive,
      notes: projection.notes || null,
    };
  }
}

