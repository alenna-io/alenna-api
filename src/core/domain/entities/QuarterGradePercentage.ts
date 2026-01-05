export class QuarterGradePercentage {
  constructor(
    public readonly id: string,
    public readonly schoolYearId: string,
    public readonly quarter: string,
    public readonly percentage: number,
    public readonly deletedAt?: Date,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) { }

  static create(props: {
    id: string;
    schoolYearId: string;
    quarter: string;
    percentage: number;
    deletedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }): QuarterGradePercentage {
    return new QuarterGradePercentage(
      props.id,
      props.schoolYearId,
      props.quarter,
      props.percentage,
      props.deletedAt,
      props.createdAt,
      props.updatedAt,
    );
  }
}
