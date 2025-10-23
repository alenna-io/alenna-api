// Domain Entity: Projection
export class Projection {
  constructor(
    public readonly id: string,
    public readonly studentId: string,
    public readonly schoolYear: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly isActive: boolean = true,
    public readonly notes?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  static create(props: {
    id: string;
    studentId: string;
    schoolYear: string;
    startDate: Date;
    endDate: Date;
    isActive?: boolean;
    notes?: string;
  }): Projection {
    return new Projection(
      props.id,
      props.studentId,
      props.schoolYear,
      props.startDate,
      props.endDate,
      props.isActive ?? true,
      props.notes,
      new Date(),
      new Date()
    );
  }

  update(props: Partial<Omit<Projection, 'id' | 'studentId' | 'createdAt' | 'updatedAt'>>): Projection {
    return new Projection(
      this.id,
      this.studentId,
      props.schoolYear ?? this.schoolYear,
      props.startDate ?? this.startDate,
      props.endDate ?? this.endDate,
      props.isActive ?? this.isActive,
      props.notes ?? this.notes,
      this.createdAt,
      new Date()
    );
  }

  get isCurrentSchoolYear(): boolean {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
  }
}

