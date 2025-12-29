// Domain Entity: ProjectionPace (Student-specific PACE tracking)
export class ProjectionPace {
  constructor(
    public readonly id: string,
    public readonly projectionId: string,
    public readonly paceCatalogId: string,
    public readonly quarter: string,
    public readonly week: number,
    public readonly grade: number | null = null,
    public readonly isCompleted: boolean = false,
    public readonly isFailed: boolean = false,
    public readonly isUnfinished: boolean = false,
    public readonly originalQuarter?: string,
    public readonly originalWeek?: number,
    public readonly comments?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) { }

  static create(props: {
    id: string;
    projectionId: string;
    paceCatalogId: string;
    quarter: string;
    week: number;
    grade?: number | null;
    isCompleted?: boolean;
    isFailed?: boolean;
    isUnfinished?: boolean;
    originalQuarter?: string;
    originalWeek?: number;
    comments?: string;
  }): ProjectionPace {
    return new ProjectionPace(
      props.id,
      props.projectionId,
      props.paceCatalogId,
      props.quarter,
      props.week,
      props.grade ?? null,
      props.isCompleted ?? false,
      props.isFailed ?? false,
      props.isUnfinished ?? false,
      props.originalQuarter,
      props.originalWeek,
      props.comments,
      new Date(),
      new Date()
    );
  }

  update(props: Partial<Omit<ProjectionPace, 'id' | 'projectionId' | 'paceCatalogId' | 'createdAt' | 'updatedAt'>>): ProjectionPace {
    return new ProjectionPace(
      this.id,
      this.projectionId,
      this.paceCatalogId,
      props.quarter ?? this.quarter,
      props.week ?? this.week,
      props.grade !== undefined ? props.grade : this.grade,
      props.isCompleted ?? this.isCompleted,
      props.isFailed ?? this.isFailed,
      props.isUnfinished ?? this.isUnfinished,
      props.originalQuarter ?? this.originalQuarter,
      props.originalWeek ?? this.originalWeek,
      props.comments ?? this.comments,
      this.createdAt,
      new Date()
    );
  }

  get isPassing(): boolean {
    return this.grade !== null && this.grade >= 80;
  }

  get needsRetake(): boolean {
    return this.grade !== null && this.grade < 80;
  }
}

// Keep old name as alias for backwards compatibility during migration
export { ProjectionPace as Pace };

