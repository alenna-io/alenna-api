import { container } from '../../../frameworks/di/container';
import { clerkService } from '../../../frameworks/services/ClerkService';

export interface UpdatePasswordInput {
  userId: string;
  clerkId: string;
  password: string;
}

export class UpdatePasswordUseCase {
  async execute(input: UpdatePasswordInput): Promise<void> {
    // Update password in Clerk
    await clerkService.updateUserPassword(input.clerkId, input.password);

    // Update createdPassword flag in database
    await container.userRepository.update(input.userId, {
      createdPassword: true,
    });
  }
}

