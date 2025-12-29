import prisma from '../../../frameworks/database/prisma.client';
import { QuarterMapper } from '../../../frameworks/database/mappers';
import type { Quarter } from '../../../domain/entities/SchoolYear';

export interface QuarterStatus extends Quarter {
  status: 'open' | 'gracePeriod' | 'closed';
  canClose: boolean;
}

export class GetQuartersStatusUseCase {
  async execute(schoolYearId: string, schoolId: string): Promise<QuarterStatus[]> {
    const schoolYear = await prisma.schoolYear.findFirst({
      where: {
        id: schoolYearId,
        schoolId,
        deletedAt: null,
      },
    });

    if (!schoolYear) {
      throw new Error('School year not found');
    }

    const quarters = await prisma.quarter.findMany({
      where: {
        schoolYearId,
        deletedAt: null,
      },
      include: {
        quarterHolidays: true,
        schoolWeeks: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    const now = new Date();

    return quarters.map(quarter => {
      let status: 'open' | 'gracePeriod' | 'closed';
      let canClose = false;

      if (quarter.isClosed) {
        status = 'closed';
      } else {
        const gracePeriodEnd = new Date(quarter.endDate);
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

        if (now <= quarter.endDate) {
          status = 'open';
        } else if (now <= gracePeriodEnd) {
          status = 'gracePeriod';
          canClose = true;
        } else {
          status = 'open';
        }
      }

      const quarterDomain = QuarterMapper.toDomain(quarter);

      return {
        ...quarterDomain,
        status,
        canClose,
      };
    });
  }
}

