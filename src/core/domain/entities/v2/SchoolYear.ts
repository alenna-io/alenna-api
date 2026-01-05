import { InvalidEntityError } from '../../../app/errors/v2';

export enum SchoolYearStatusEnum {
  CURRENT_YEAR = "CURRENT_YEAR",
  ARCHIVED = "ARCHIVED"
}

export type SchoolYearStatus = keyof typeof SchoolYearStatusEnum;

export class SchoolYear {
  constructor(
    public readonly id: string,
    public readonly schoolId: string,
    public readonly name: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly status: SchoolYearStatus,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {
    if (startDate > endDate) {
      throw new InvalidEntityError('SchoolYear', 'Start date cannot be after end date');
    }

    if (startDate == endDate) {
      throw new InvalidEntityError('SchoolYear', 'Start date cannot be equal to end date');
    }
  }
}