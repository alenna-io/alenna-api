import { InvalidEntityError } from '../../../app/errors/v2';

export class School {
  constructor(
    public readonly id: string,
    public readonly isActive: boolean,
    public readonly name: string,
    public readonly address?: string,
    public readonly phone?: string,
    public readonly email?: string,
    public readonly logoUrl?: string,
    public readonly teacherLimit?: number,
    public readonly userLimit?: number,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {

    if (name.length < 3) {
      throw new InvalidEntityError('School', 'Name must be at least 3 characters long.');
    }

    if (name.length > 100) {
      throw new InvalidEntityError('School', 'Max name length is 100 characters.');
    }

  }
}