import { ProjectionPace, ProjectionPaceStatusEnum } from '../entities/v2/ProjectionPace';

export class ProjectionPaceFactory {
  static create(params: {
    projectionId: string;
    paceCatalogId: string;
    quarter: number;
    week: number;
  }): ProjectionPace {
    return new ProjectionPace(
      crypto.randomUUID(),
      params.projectionId,
      params.paceCatalogId,
      params.quarter.toString(),
      params.week,
      ProjectionPaceStatusEnum.PENDING,
      undefined,
      new Date(),
      new Date()
    );
  }
}
