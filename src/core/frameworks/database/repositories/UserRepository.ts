import { IUserRepository } from '../../../adapters_interface/repositories';
import { User } from '../../../domain/entities';
import prisma from '../prisma.client';
import { UserMapper } from '../mappers';
import { UserRole } from '@prisma/client';

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return user ? UserMapper.toDomain(user) : null;
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    return user ? UserMapper.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    return user ? UserMapper.toDomain(user) : null;
  }

  async findBySchoolId(schoolId: string): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { schoolId },
      orderBy: { lastName: 'asc' },
    });

    return users.map(UserMapper.toDomain);
  }

  async create(user: User): Promise<User> {
    const created = await prisma.user.create({
      data: {
        clerkId: user.clerkId,
        email: user.email,
        schoolId: user.schoolId,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        role: user.role as UserRole,
      },
    });

    return UserMapper.toDomain(created);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        role: data.role as UserRole | undefined,
      },
    });

    return UserMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }
}

