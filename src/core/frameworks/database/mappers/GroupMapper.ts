import { Group as PrismaGroup } from '@prisma/client';
import { Group } from '../../../domain/entities';

export class GroupMapper {
  static toDomain(prismaGroup: PrismaGroup): Group {
    return new Group(
      prismaGroup.id,
      prismaGroup.name || null,
      prismaGroup.teacherId,
      prismaGroup.schoolYearId,
      prismaGroup.schoolId,
      prismaGroup.deletedAt,
      prismaGroup.createdAt,
      prismaGroup.updatedAt
    );
  }

  static toPrisma(group: Group): Omit<PrismaGroup, 'createdAt' | 'updatedAt'> {
    return {
      id: group.id,
      name: group.name || null,
      teacherId: group.teacherId,
      schoolYearId: group.schoolYearId,
      schoolId: group.schoolId,
      deletedAt: group.deletedAt,
    };
  }
}
