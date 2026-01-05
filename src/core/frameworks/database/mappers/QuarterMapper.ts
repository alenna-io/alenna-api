import type {
  Quarter as PrismaQuarter,
  QuarterHoliday as PrismaQuarterHoliday,
  SchoolWeek as PrismaSchoolWeek,
} from '@prisma/client';
import type { Quarter } from '../../../domain/entities';

export type PrismaQuarterWithRelations = PrismaQuarter & {
  quarterHolidays?: PrismaQuarterHoliday[];
  schoolWeeks?: PrismaSchoolWeek[];
};

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
      quarterHolidays: prismaQuarter.quarterHolidays?.map(h => ({
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