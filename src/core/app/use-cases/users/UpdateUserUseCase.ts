import { IUserRepository } from '../../../adapters_interface/repositories';
import { User } from '../../../domain/entities';
import { UpdateUserInput } from '../../dtos';

export class UpdateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(
    userId: string,
    input: UpdateUserInput,
    currentUserId: string,
    currentUserRole: string
  ): Promise<User> {
    // Check if user exists
    const existingUser = await this.userRepository.findById(userId);

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Permission check: Admin can update anyone, others can only update themselves
    if (currentUserRole !== 'ADMIN' && currentUserId !== userId) {
      throw new Error('Forbidden: Cannot update other users');
    }

    // Non-admins cannot change their own role
    if (currentUserRole !== 'ADMIN' && input.role) {
      throw new Error('Forbidden: Cannot change your own role');
    }

    const updatedUser = existingUser.update(input);
    return this.userRepository.update(userId, updatedUser);
  }
}

