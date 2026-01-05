export enum ProjectionPaceStatusEnum {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  UNFINISHED = "UNFINISHED",
}

export type ProjectionPaceStatus = keyof typeof ProjectionPaceStatusEnum;

export class ProjectionPace {
  constructor(
    public readonly id: string,
    public readonly projectionId: string,
    public readonly paceCatalogId: string,
    public readonly quarter: string,
    public readonly week: number,
    public readonly status: ProjectionPaceStatus,
    public readonly grade?: number,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) { }
}
