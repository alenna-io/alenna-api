// Domain Entity: Group - Represents a teacher's group of students for a school year
export class Group {
  constructor(
    public readonly id: string,
    public readonly name: string | null,
    public readonly teacherId: string,
    public readonly schoolYearId: string,
    public readonly schoolId: string,
    public readonly deletedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(props: {
    id: string;
    name?: string | null;
    teacherId: string;
    schoolYearId: string;
    schoolId: string;
  }): Group {
    return new Group(
      props.id,
      props.name || null,
      props.teacherId,
      props.schoolYearId,
      props.schoolId,
      null,
      new Date(),
      new Date()
    );
  }

  update(props: Partial<Pick<Group, 'name'>>): Group {
    return new Group(
      this.id,
      props.name !== undefined ? props.name : this.name,
      this.teacherId,
      this.schoolYearId,
      this.schoolId,
      this.deletedAt,
      this.createdAt,
      new Date()
    );
  }

  softDelete(): Group {
    return new Group(
      this.id,
      this.name,
      this.teacherId,
      this.schoolYearId,
      this.schoolId,
      new Date(),
      this.createdAt,
      new Date()
    );
  }
}
