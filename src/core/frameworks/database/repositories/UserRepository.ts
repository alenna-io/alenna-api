import { IUserRepository } from '../../../adapters_interface/repositories';
import { User } from '../../../domain/entities';
import prisma from '../prisma.client';
import { UserMapper } from '../mappers';
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
    if (!clerkId) {
      return null;
    }
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
    const user = await prisma.user.findFirst({
      where: { 
        email,
        deletedAt: null, // Only find non-deleted users
      },
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

  async findByEmailIncludingDeleted(email: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' }, // Get most recent user with this email
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
          clerkId: user.clerkId || null,
          email: user.email,
          schoolId: user.schoolId,
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          language: user.language || null,
          isActive: user.isActive ?? true, // Default to true for new users
          createdPassword: user.createdPassword ?? false, // Default to false for new users
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
        createdPassword: data.createdPassword !== undefined ? data.createdPassword : undefined,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        language: data.language || undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return UserMapper.toDomain(updated);
  }

  async deactivate(id: string): Promise<User> {
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return UserMapper.toDomain(updated);
  }

  async reactivate(id: string): Promise<User> {
    const updated = await prisma.user.update({
      where: { id },
      data: { 
        isActive: true,
        deletedAt: null, // Restore soft-deleted user
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return UserMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    // Soft delete (only for inactive users - this should be checked in the use case)
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

