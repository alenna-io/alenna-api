import type { SchoolYear as PrismaSchoolYear, Quarter as PrismaQuarter } from '@prisma/client';
import type { SchoolYear, Quarter } from '../../../domain/entities';

export class SchoolYearMapper {
  static toDomain(prismaSchoolYear: PrismaSchoolYear & { quarters?: PrismaQuarter[] }): SchoolYear {
    return {
      id: prismaSchoolYear.id,
      schoolId: prismaSchoolYear.schoolId,
      name: prismaSchoolYear.name,
      startDate: prismaSchoolYear.startDate,
      endDate: prismaSchoolYear.endDate,
      isActive: prismaSchoolYear.isActive,
      quarters: prismaSchoolYear.quarters?.map(QuarterMapper.toDomain),
      deletedAt: prismaSchoolYear.deletedAt ?? undefined,
      createdAt: prismaSchoolYear.createdAt,
      updatedAt: prismaSchoolYear.updatedAt,
    };
  }
}

export class QuarterMapper {
  static toDomain(prismaQuarter: PrismaQuarter): Quarter {
    return {
      id: prismaQuarter.id,
      schoolYearId: prismaQuarter.schoolYearId,
      name: prismaQuarter.name,
      displayName: prismaQuarter.displayName,
      startDate: prismaQuarter.startDate,
      endDate: prismaQuarter.endDate,
      order: prismaQuarter.order,
      weeksCount: prismaQuarter.weeksCount,
      deletedAt: prismaQuarter.deletedAt ?? undefined,
      createdAt: prismaQuarter.createdAt,
      updatedAt: prismaQuarter.updatedAt,
    };
  }
}

