import type {
  SchoolYear as PrismaSchoolYear,
  QuarterGradePercentage as PrismaQuarterGradePercentage,
} from '@prisma/client';
import type { SchoolYear } from '../../../domain/entities';
import { QuarterMapper, PrismaQuarterWithRelations, QuarterGradePercentageMapper } from './';

export class SchoolYearMapper {
  static toDomain(
    prismaSchoolYear: PrismaSchoolYear &
    {
      quarters?: PrismaQuarterWithRelations[],
      quarterGradePercentages?: PrismaQuarterGradePercentage[]
    }
  ): SchoolYear {
    return {
      id: prismaSchoolYear.id,
      schoolId: prismaSchoolYear.schoolId,
      name: prismaSchoolYear.name,
      startDate: prismaSchoolYear.startDate,
      endDate: prismaSchoolYear.endDate,
      isActive: prismaSchoolYear.isActive,
      quarters: prismaSchoolYear.quarters?.map(QuarterMapper.toDomain),
      quarterGradePercentages: prismaSchoolYear.quarterGradePercentages?.map(QuarterGradePercentageMapper.toDomain),
      deletedAt: prismaSchoolYear.deletedAt ?? undefined,
      createdAt: prismaSchoolYear.createdAt,
      updatedAt: prismaSchoolYear.updatedAt,
    };
  }
}
