import { IUserRepository } from '../../../adapters_interface/repositories';
import { User } from '../../../domain/entities';
import prisma from '../prisma.client';
import { UserMapper } from '../mappers';
import { UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return user ? UserMapper.toDomain(user) : null;
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return user ? UserMapper.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return user ? UserMapper.toDomain(user) : null;
  }

  async findBySchoolId(schoolId: string): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { 
        schoolId,
        deletedAt: null, // Soft delete filter
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { lastName: 'asc' },
    });

    return users.map(UserMapper.toDomain);
  }

  async findAll(): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { 
        deletedAt: null, // Soft delete filter
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { lastName: 'asc' },
    });

    return users.map(UserMapper.toDomain);
  }

  async create(user: User, roleIds?: string[]): Promise<User> {
    const created = await prisma.$transaction(async (tx) => {
      // Create the user
      const createdUser = await tx.user.create({
        data: {
          clerkId: user.clerkId,
          email: user.email,
          schoolId: user.schoolId,
          firstName: user.firstName || null,
          lastName: user.lastName || null,
        },
      });

      // Assign roles if provided
      if (roleIds && roleIds.length > 0) {
        await tx.userRole.createMany({
          data: roleIds.map(roleId => ({
            id: randomUUID(),
            userId: createdUser.id,
            roleId: roleId,
          })),
        });
      }

      return createdUser;
    });

    // Fetch the created user with roles
    const userWithRoles = await prisma.user.findUnique({
      where: { id: created.id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return UserMapper.toDomain(userWithRoles!);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        schoolId: data.schoolId || undefined,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
      },
    });

    return UserMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    // Soft delete
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

