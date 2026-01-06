import { ProjectionPace } from '../../../../domain/entities/v2/ProjectionPace';

export class ProjectionPaceMapper {
  static toDomain(raw: any): ProjectionPace {
    return new ProjectionPace(
      raw.id,
      raw.projectionId,
      raw.paceCatalogId,
      raw.quarter,
      raw.week,
      raw.status,
      raw.grade,
      raw.createdAt,
      raw.updatedAt
    );
  }

  static toPrisma(projectionPace: ProjectionPace): any {
    return {
      id: projectionPace.id,
      projectionId: projectionPace.projectionId,
      paceCatalogId: projectionPace.paceCatalogId,
      quarter: projectionPace.quarter,
      week: projectionPace.week,
      status: projectionPace.status,
      grade: projectionPace.grade,
    };
  }
}