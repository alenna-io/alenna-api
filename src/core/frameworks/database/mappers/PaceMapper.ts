import { ProjectionPace } from '../../../domain/entities';
import { ProjectionPace as PrismaProjectionPace } from '@prisma/client';

export class ProjectionPaceMapper {
  static toDomain(projectionPace: PrismaProjectionPace): ProjectionPace {
    return new ProjectionPace(
      projectionPace.id,
      projectionPace.projectionId,
      projectionPace.paceCatalogId,
      projectionPace.quarter,
      projectionPace.week,
      projectionPace.grade,
      projectionPace.isCompleted,
      projectionPace.isFailed,
      projectionPace.comments ?? undefined,
      projectionPace.createdAt,
      projectionPace.updatedAt
    );
  }
}

// Keep old name as alias for backwards compatibility
export { ProjectionPaceMapper as PaceMapper };

