import { IUserRepository } from '../../../adapters_interface/repositories';
import { User } from '../../../domain/entities';

export class GetUsersUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(schoolId: string): Promise<User[]> {
    return this.userRepository.findBySchoolId(schoolId);
  }
}

