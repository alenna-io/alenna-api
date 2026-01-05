import { ProjectionPace } from '../../../domain/entities';
import {
  ProjectionPace as PrismaProjectionPace,
  PaceCatalog as PrismaPaceCatalog
} from '@prisma/client';
// import { PaceCatalogMapper } from './';

export class ProjectionPaceMapper {
  static toDomain(
    projectionPace: PrismaProjectionPace,
    paceCatalog?: PrismaPaceCatalog | null
  ): ProjectionPace {
    return new ProjectionPace(
      projectionPace.id,
      projectionPace.projectionId,
      projectionPace.paceCatalogId,
      projectionPace.quarter,
      projectionPace.week,
      projectionPace.grade,
      projectionPace.isCompleted,
      projectionPace.isFailed,
      projectionPace.isUnfinished,
      projectionPace.originalQuarter ?? undefined,
      projectionPace.originalWeek ?? undefined,
      projectionPace.comments ?? undefined,
      paceCatalog ? paceCatalog : undefined,
      projectionPace.createdAt,
      projectionPace.updatedAt
    );
  }

  static toPrisma(projectionPace: ProjectionPace): Omit<PrismaProjectionPace, 'createdAt' | 'updatedAt'> {
    return {
      id: projectionPace.id,
      projectionId: projectionPace.projectionId,
      paceCatalogId: projectionPace.paceCatalogId,
      quarter: projectionPace.quarter,
      week: projectionPace.week,
      grade: projectionPace.grade,
      isCompleted: projectionPace.isCompleted,
      isFailed: projectionPace.isFailed,
      isUnfinished: projectionPace.isUnfinished,
      originalQuarter: projectionPace.originalQuarter ?? null,
      originalWeek: projectionPace.originalWeek ?? null,
      comments: projectionPace.comments ?? null,
      deletedAt: null,
    };
  }

  static toPrismaUpdate(
    projectionPace: Partial<ProjectionPace>
  ): Partial<Omit<PrismaProjectionPace, 'createdAt' | 'updatedAt'>> {
    return {
      ...(projectionPace.projectionId && { projectionId: projectionPace.projectionId }),
      ...(projectionPace.paceCatalogId && { paceCatalogId: projectionPace.paceCatalogId }),
      ...(projectionPace.quarter !== undefined && { quarter: projectionPace.quarter }),
      ...(projectionPace.week !== undefined && { week: projectionPace.week }),
      ...(projectionPace.grade !== undefined && { grade: projectionPace.grade }),
      ...(projectionPace.isCompleted !== undefined && { isCompleted: projectionPace.isCompleted }),
      ...(projectionPace.isFailed !== undefined && { isFailed: projectionPace.isFailed }),
      ...(projectionPace.isUnfinished !== undefined && { isUnfinished: projectionPace.isUnfinished }),
      ...(projectionPace.originalQuarter !== undefined && { originalQuarter: projectionPace.originalQuarter ?? null }),
      ...(projectionPace.originalWeek !== undefined && { originalWeek: projectionPace.originalWeek ?? null }),
      ...(projectionPace.comments !== undefined && { comments: projectionPace.comments ?? null }),
    };
  }

}

// Keep old name as alias for backwards compatibility
export { ProjectionPaceMapper as PaceMapper };

