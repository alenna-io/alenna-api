import { User as PrismaUser, Role } from '@prisma/client';
import { User, UserRoleInfo } from '../../../domain/entities';

export class UserMapper {
  static toDomain(prismaUser: PrismaUser & { userRoles?: { role: Role }[] }): User {
    const roles: UserRoleInfo[] = prismaUser.userRoles?.map(ur => ({
      id: ur.role.id,
      name: ur.role.name,
      displayName: ur.role.displayName,
    })) || [];

    return new User(
      prismaUser.id,
      prismaUser.clerkId || null,
      prismaUser.email,
      prismaUser.schoolId,
      prismaUser.firstName || undefined,
      prismaUser.lastName || undefined,
      prismaUser.language || undefined,
      prismaUser.isActive ?? true,
      roles,
      prismaUser.createdAt,
      prismaUser.updatedAt
    );
  }

  static toPrisma(user: User): Omit<PrismaUser, 'createdAt' | 'updatedAt'> {
    return {
      id: user.id,
      clerkId: user.clerkId || null,
      email: user.email,
      schoolId: user.schoolId,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      language: user.language || null,
      isActive: user.isActive,
      deletedAt: null,
    };
  }
}

