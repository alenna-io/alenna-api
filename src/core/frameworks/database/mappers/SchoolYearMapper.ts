import type { SchoolYear as PrismaSchoolYear, Quarter as PrismaQuarter, QuarterHoliday, SchoolWeek } from '@prisma/client';
import type { SchoolYear, Quarter } from '../../../domain/entities';

type PrismaQuarterWithRelations = PrismaQuarter & {
  quarterHolidays?: QuarterHoliday[];
  schoolWeeks?: SchoolWeek[];
};

export class SchoolYearMapper {
  static toDomain(prismaSchoolYear: PrismaSchoolYear & { quarters?: PrismaQuarterWithRelations[] }): SchoolYear {
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
  static toDomain(prismaQuarter: PrismaQuarterWithRelations): Quarter {
    return {
      id: prismaQuarter.id,
      schoolYearId: prismaQuarter.schoolYearId,
      name: prismaQuarter.name,
      displayName: prismaQuarter.displayName,
      startDate: prismaQuarter.startDate,
      endDate: prismaQuarter.endDate,
      order: prismaQuarter.order,
      weeksCount: prismaQuarter.weeksCount,
      isClosed: prismaQuarter.isClosed,
      closedAt: prismaQuarter.closedAt ?? undefined,
      closedBy: prismaQuarter.closedBy ?? undefined,
      holidays: prismaQuarter.quarterHolidays?.map(h => ({
        id: h.id,
        schoolYearId: h.schoolYearId,
        quarterId: h.quarterId ?? undefined,
        startDate: h.startDate,
        endDate: h.endDate,
        label: h.label ?? undefined,
        deletedAt: h.deletedAt ?? undefined,
        createdAt: h.createdAt,
        updatedAt: h.updatedAt,
      })),
      schoolWeeks: prismaQuarter.schoolWeeks?.map(w => ({
        id: w.id,
        quarterId: w.quarterId,
        weekNumber: w.weekNumber,
        startDate: w.startDate,
        endDate: w.endDate,
        deletedAt: w.deletedAt ?? undefined,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      })),
      deletedAt: prismaQuarter.deletedAt ?? undefined,
      createdAt: prismaQuarter.createdAt,
      updatedAt: prismaQuarter.updatedAt,
    };
  }
}

