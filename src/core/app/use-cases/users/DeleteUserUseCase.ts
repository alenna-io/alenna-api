import { IUserRepository } from '../../../adapters_interface/repositories';

export class DeleteUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string, currentUserId: string, schoolId: string): Promise<void> {
    // Cannot delete yourself
    if (currentUserId === userId) {
      throw new Error('Cannot delete your own account');
    }

    // Check if user exists and belongs to same school
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.schoolId !== schoolId) {
      throw new Error('User does not belong to your school');
    }

    return this.userRepository.delete(userId);
  }
}

