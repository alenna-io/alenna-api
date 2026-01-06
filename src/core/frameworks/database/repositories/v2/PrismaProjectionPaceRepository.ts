import { ProjectionPaceRepository } from '../../../../adapters_interface/repositories/v2';
import { ProjectionPace } from '../../../../domain/entities/v2/ProjectionPace';
import { ProjectionPaceMapper } from '../../mappers/v2/ProjectionPaceMapper';
import { PrismaTransaction } from '../../PrismaTransaction';
import prisma from '../../prisma.client';

export class PrismaProjectionPaceRepository implements ProjectionPaceRepository {
  async createMany(
    projectionPaces: ProjectionPace[],
    tx: PrismaTransaction = prisma
  ): Promise<ProjectionPace[]> {
    const created = await tx.projectionPace.createMany({
      data: projectionPaces.map(p => ProjectionPaceMapper.toPrisma(p)),
    });
    return created ? projectionPaces.map(p => ProjectionPaceMapper.toDomain(p)) : [];
  }
}