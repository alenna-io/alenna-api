// Domain Entity: StudentTuitionAssignment
export class StudentTuitionAssignment {
  constructor(
    public readonly id: string,
    public readonly studentId: string,
    public readonly tuitionTypeId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) { }

  static create(props: {
    id: string;
    studentId: string;
    tuitionTypeId: string;
  }): StudentTuitionAssignment {
    return new StudentTuitionAssignment(props.id, props.studentId, props.tuitionTypeId, new Date(), new Date());
  }
}