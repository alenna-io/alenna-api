export class SchoolMonthlyAssignmentTemplate {
  constructor(
    public id: string,
    public name: string,
    public quarter: string,
    public schoolYearId: string,
    public createdAt: Date,
    public updatedAt: Date,
    public deletedAt?: Date
  ) { }
}