// Domain Entity: GroupStudent - Junction table linking students to groups
export class GroupStudent {
  constructor(
    public readonly id: string,
    public readonly groupId: string,
    public readonly studentId: string,
    public readonly deletedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(props: {
    id: string;
    groupId: string;
    studentId: string;
  }): GroupStudent {
    return new GroupStudent(
      props.id,
      props.groupId,
      props.studentId,
      null,
      new Date(),
      new Date()
    );
  }

  softDelete(): GroupStudent {
    return new GroupStudent(
      this.id,
      this.groupId,
      this.studentId,
      new Date(),
      this.createdAt,
      new Date()
    );
  }
}
