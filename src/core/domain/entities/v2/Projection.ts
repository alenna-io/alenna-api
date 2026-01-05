export enum ProjectionStatusEnum {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export type ProjectionStatus = keyof typeof ProjectionStatusEnum;

export class Projection {
  constructor(
    public readonly id: string,
    public readonly studentId: string,
    public readonly schoolId: string,
    public readonly schoolYear: string,
    public readonly status: ProjectionStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) { }

  isOpen(): boolean {
    return this.status === 'OPEN';
  }
}
