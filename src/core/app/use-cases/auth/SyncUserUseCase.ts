import { IUserRepository } from '../../../adapters_interface/repositories';
import { User } from '../../../domain/entities';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SyncUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(clerkId: string): Promise<User> {
    // Check if user exists in database
    const existingUser = await this.userRepository.findByClerkId(clerkId);

    if (!existingUser) {
      throw new Error('User not found. Please contact your administrator to create your account.');
    }

    // Check if user is active (deactivated users cannot access the app)
    if (!existingUser.isActive) {
      throw new Error('Your account has been deactivated. Please contact your administrator.');
    }

    // Check if user is soft deleted
    const userRecord = await prisma.user.findUnique({
      where: { id: existingUser.id },
      select: { deletedAt: true },
    });

    if (userRecord?.deletedAt) {
      throw new Error('Your account has been deleted. Please contact support.');
    }

    return existingUser;
  }
}

