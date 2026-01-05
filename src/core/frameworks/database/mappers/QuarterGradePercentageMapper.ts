import type {
  QuarterGradePercentage as PrismaQuarterGradePercentage,
} from '@prisma/client';
import type { QuarterGradePercentage } from '../../../domain/entities';

export class QuarterGradePercentageMapper {
  static toDomain(prismaQuarterGradePercentage: PrismaQuarterGradePercentage): QuarterGradePercentage {
    return {
      id: prismaQuarterGradePercentage.id,
      schoolYearId: prismaQuarterGradePercentage.schoolYearId,
      quarter: prismaQuarterGradePercentage.quarter,
      percentage: prismaQuarterGradePercentage.percentage,
      deletedAt: prismaQuarterGradePercentage.deletedAt ?? undefined,
      createdAt: prismaQuarterGradePercentage.createdAt,
      updatedAt: prismaQuarterGradePercentage.updatedAt,
    };
  }
}