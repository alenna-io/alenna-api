import { IUserRepository } from '../../../adapters_interface/repositories';
import { User } from '../../../domain/entities';
import { CreateUserInput } from '../../dtos';
import { randomUUID } from 'crypto';
import { clerkService } from '../../../frameworks/services/ClerkService';
import prisma from '../../../frameworks/database/prisma.client';

export class CreateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    // Check if user with email already exists (not deleted)
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Check if there's a soft-deleted user with this email
    const deletedUser = await this.userRepository.findByEmailIncludingDeleted(input.email);
    let userId: string;
    let clerkId = input.clerkId;

    // Check if user is soft-deleted by querying the database directly
    let isDeleted = false;
    if (deletedUser) {
      const userRecord = await prisma.user.findUnique({
        where: { id: deletedUser.id },
        select: { deletedAt: true },
      });
      isDeleted = userRecord?.deletedAt !== null;
    }

    if (deletedUser && isDeleted) {
      // User was soft-deleted - reactivate them instead of creating a new user
      userId = deletedUser.id;
      
      // Create a new Clerk user (old one was deleted)
      if (!clerkId) {
        try {
          clerkId = await clerkService.createUser({
            email: input.email,
            firstName: input.firstName || deletedUser.firstName || undefined,
            lastName: input.lastName || deletedUser.lastName || undefined,
            password: input.password,
          });
        } catch (error: any) {
          console.error('Error creating Clerk user:', error);
          throw new Error(`Failed to create Clerk user: ${error.message || 'Unknown error'}`);
        }
      }

      // Reactivate the user and update their information
      await this.userRepository.reactivate(userId);
      
      // Update user information
      const updatedUser = await this.userRepository.update(userId, {
        clerkId,
        firstName: input.firstName || deletedUser.firstName || undefined,
        lastName: input.lastName || deletedUser.lastName || undefined,
        schoolId: input.schoolId,
        isActive: true,
      });

      // Update roles if provided
      if (input.roleIds && input.roleIds.length > 0) {
        // Remove old roles and assign new ones
        await prisma.userRole.deleteMany({
          where: { userId },
        });

        await prisma.userRole.createMany({
          data: input.roleIds.map(roleId => ({
            id: randomUUID(),
            userId,
            roleId,
          })),
        });

        // Fetch updated user with roles
        const userWithRoles = await this.userRepository.findById(userId);
        return userWithRoles!;
      }

      return updatedUser;
    }

    // No deleted user found - create new user as normal
    if (!clerkId) {
      try {
        clerkId = await clerkService.createUser({
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          password: input.password,
        });
      } catch (error: any) {
        console.error('Error creating Clerk user:', error);
        throw new Error(`Failed to create Clerk user: ${error.message || 'Unknown error'}`);
      }
    } else {
      // Check if user with provided clerkId already exists
      const existingClerkUser = await this.userRepository.findByClerkId(clerkId);
      if (existingClerkUser) {
        throw new Error('User with this Clerk ID already exists');
      }
    }

    // Create user entity
    const user = User.create({
      id: randomUUID(),
      clerkId,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      schoolId: input.schoolId,
    });

    // Save user and assign roles
    const createdUser = await this.userRepository.create(user, input.roleIds);
    
    return createdUser;
  }
}
