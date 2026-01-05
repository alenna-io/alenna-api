export type PaceStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'UNFINISHED';

export class ProjectionPace {
  constructor(
    public readonly id: string,
    public readonly projectionId: string,
    public readonly paceCatalogId: string,
    public readonly quarter: string,
    public readonly week: number,
    public readonly status: PaceStatus,
    public readonly grade?: number,
    public readonly comments?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) { }
}
