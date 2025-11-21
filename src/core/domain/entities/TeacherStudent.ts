// Teacher-Student relationship per school year (Groups)
export class TeacherStudent {
  constructor(
    public readonly id: string,
    public readonly teacherId: string,
    public readonly studentId: string,
    public readonly schoolYearId: string,
    public readonly deletedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly name: string | null = null
  ) {}
}

