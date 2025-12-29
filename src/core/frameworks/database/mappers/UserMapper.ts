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
      prismaUser.phone || undefined,
      prismaUser.language || undefined,
      prismaUser.isActive ?? true,
      prismaUser.createdPassword ?? false,
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
      createdPassword: user.createdPassword,
      deletedAt: null,
      phone: (user as any).phone || null,
      streetAddress: (user as any).streetAddress || null,
      city: (user as any).city || null,
      state: (user as any).state || null,
      country: (user as any).country || null,
      zipCode: (user as any).zipCode || null,
    };
  }
}

