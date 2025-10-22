// Domain Entity: GradeHistory
export class GradeHistory {
  constructor(
    public readonly id: string,
    public readonly paceId: string,
    public readonly grade: number,
    public readonly date: Date,
    public readonly note?: string,
    public readonly createdAt?: Date
  ) {}

  static create(props: {
    id: string;
    paceId: string;
    grade: number;
    date: Date;
    note?: string;
  }): GradeHistory {
    return new GradeHistory(
      props.id,
      props.paceId,
      props.grade,
      props.date,
      props.note,
      new Date()
    );
  }
}

