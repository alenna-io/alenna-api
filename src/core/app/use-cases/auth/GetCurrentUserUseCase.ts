import { IUserRepository } from '../../../adapters_interface/repositories';
import { User } from '../../../domain/entities';

export class GetCurrentUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}

