import { ProjectionPace } from '../../../domain/entities/v2/ProjectionPace';
import { PrismaTransaction } from '../../../frameworks/database/PrismaTransaction';

export interface ProjectionPaceRepository {
  createMany(
    projectionPaces: ProjectionPace[],
    tx?: PrismaTransaction
  ): Promise<ProjectionPace[]>;
}