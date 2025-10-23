import { Role as PrismaRole } from '@prisma/client';
import { Role } from '../../../domain/entities';

export class RoleMapper {
  static toDomain(prismaRole: PrismaRole): Role {
    return new Role(
      prismaRole.id,
      prismaRole.name,
      prismaRole.displayName,
      prismaRole.description || undefined,
      prismaRole.isSystem,
      prismaRole.isActive,
      prismaRole.schoolId || undefined,
      prismaRole.createdAt,
      prismaRole.updatedAt
    );
  }

  static toPrisma(role: Role): Omit<PrismaRole, 'createdAt' | 'updatedAt'> {
    return {
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description || null,
      isSystem: role.isSystem,
      isActive: role.isActive,
      schoolId: role.schoolId || null,
    };
  }
}
