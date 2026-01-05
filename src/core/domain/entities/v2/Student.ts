import { InvalidEntityError } from '../../../app/errors/v2';

export enum StudentStatusEnum {
  ENROLLED = "ENROLLED",
  ON_TRACK = "ON_TRACK",
  BEHIND_SCHEDULE = "BEHIND_SCHEDULE",
  AHEAD_OF_SCHEDULE = "AHEAD_OF_SCHEDULE",
  GRADUATED = "GRADUATED",
}

export type StudentStatus = keyof typeof StudentStatusEnum;

export class Student {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly schoolId: string,
    public readonly birthDate: Date,
    public readonly graduationDate: Date,
    public readonly status: StudentStatus,
    public readonly certificationTypeId: string,
    public readonly expectedLevel?: string,
    public readonly currentLevel?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {

    if (birthDate > graduationDate) {
      throw new InvalidEntityError('Student', 'Birth date cannot be after graduation date');
    }

    if (birthDate > new Date()) {
      throw new InvalidEntityError('Student', 'Birth date cannot be in the future');
    }

    if (expectedLevel && currentLevel && currentLevel > expectedLevel) {
      console.log('currentLevel', currentLevel);
      console.log('expectedLevel', expectedLevel);
      throw new InvalidEntityError('Student', 'Current level must be lower than expected level');
    }

  }
}