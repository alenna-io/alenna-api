import { User as PrismaUser, UserRole } from '@prisma/client';
import { User } from '../../../domain/entities';

export class UserMapper {
  static toDomain(prismaUser: PrismaUser): User {
    return new User(
      prismaUser.id,
      prismaUser.clerkId,
      prismaUser.email,
      prismaUser.schoolId,
      prismaUser.firstName || undefined,
      prismaUser.lastName || undefined,
      prismaUser.role as any,
      prismaUser.createdAt,
      prismaUser.updatedAt
    );
  }

  static toPrisma(user: User): Omit<PrismaUser, 'createdAt' | 'updatedAt'> {
    return {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      schoolId: user.schoolId,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      role: user.role as UserRole,
    };
  }
}

