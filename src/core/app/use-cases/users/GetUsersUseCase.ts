import { IUserRepository } from '../../../adapters_interface/repositories';
import { User } from '../../../domain/entities';

export class GetUsersUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(schoolId?: string): Promise<User[]> {
    if (schoolId) {
      return this.userRepository.findBySchoolId(schoolId);
    }
    
    // For superadmins, get all users from all schools
    return this.userRepository.findAll();
  }
}

