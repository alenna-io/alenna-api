import { InvalidEntityError } from '../../../app/errors/v2';

export enum QuarterStatusEnum {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}
export type QuarterStatus = keyof typeof QuarterStatusEnum;

export class Quarter {
  constructor(
    public readonly id: string,
    public readonly schoolYearId: string,
    public readonly name: string,
    public readonly displayName: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly order: number,
    public readonly weeksCount: number,
    public readonly status: QuarterStatus,
    public readonly closedAt?: Date,
    public readonly closedBy?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {

    if (this.endDate < this.startDate) {
      throw new InvalidEntityError('Quarter', 'End date cannot be before start date');
    } else if (this.endDate === this.startDate) {
      throw new InvalidEntityError('Quarter', 'End date cannot be equal to start date');
    }

    if (this.weeksCount < 1) {
      throw new InvalidEntityError('Quarter', 'Weeks count cannot be less than 1');
    }
  }
}