import { IUserRepository } from '../../../adapters_interface/repositories';
import { User } from '../../../domain/entities';
import { CreateUserInput } from '../../dtos';
import { randomUUID } from 'crypto';

export class CreateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    // Check if user with email already exists
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Check if user with clerkId already exists
    const existingClerkUser = await this.userRepository.findByClerkId(input.clerkId);
    if (existingClerkUser) {
      throw new Error('User with this Clerk ID already exists');
    }

    // Create user entity
    const user = User.create({
      id: randomUUID(),
      clerkId: input.clerkId,
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
