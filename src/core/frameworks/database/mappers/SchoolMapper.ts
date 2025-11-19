import { School as PrismaSchool } from '@prisma/client';
import { School } from '../../../domain/entities';

export class SchoolMapper {
  static toDomain(prismaSchool: PrismaSchool): School {
    return new School(
      prismaSchool.id,
      prismaSchool.name,
      prismaSchool.address || undefined,
      prismaSchool.phone || undefined,
      prismaSchool.email || undefined,
      prismaSchool.teacherLimit || undefined,
      prismaSchool.userLimit || undefined,
      prismaSchool.createdAt,
      prismaSchool.updatedAt
    );
  }

  static toPrisma(school: School): Omit<PrismaSchool, 'createdAt' | 'updatedAt'> {
    return {
      id: school.id,
      name: school.name,
      address: school.address || null,
      phone: school.phone || null,
      email: school.email || null,
      teacherLimit: school.teacherLimit || null,
      userLimit: school.userLimit || null,
      deletedAt: null,
    };
  }
}

