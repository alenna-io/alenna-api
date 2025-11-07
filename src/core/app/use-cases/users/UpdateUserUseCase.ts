import { IUserRepository } from '../../../adapters_interface/repositories';
import { User } from '../../../domain/entities';
import { UpdateUserInput } from '../../dtos';

export class UpdateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(
    userId: string,
    input: UpdateUserInput,
    currentUserId: string,
    currentUserRoles: string[]
  ): Promise<User> {
    // Check if user exists
    const existingUser = await this.userRepository.findById(userId);

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Permission check: SuperAdmin/School Admin can update anyone, others can only update themselves
    const canManageUsers = currentUserRoles.includes('SUPERADMIN') || currentUserRoles.includes('SCHOOL_ADMIN');
    if (!canManageUsers && currentUserId !== userId) {
      throw new Error('Forbidden: Cannot update other users');
    }

    // Non-admins cannot change their own roles
    if (!canManageUsers && input.roleIds) {
      throw new Error('Forbidden: Cannot change your own roles');
    }

    const updatedUser = existingUser.update(input);
    return this.userRepository.update(userId, updatedUser);
  }
}

