import prisma from '../../../frameworks/database/prisma.client';
import { QuarterMapper } from '../../../frameworks/database/mappers';
import { RedistributeUnfinishedPacesUseCase } from '../projections/RedistributeUnfinishedPacesUseCase';
import type { Quarter } from '../../../domain/entities/SchoolYear';

export class CloseQuarterUseCase {
  private redistributeUseCase: RedistributeUnfinishedPacesUseCase;

  constructor() {
    this.redistributeUseCase = new RedistributeUnfinishedPacesUseCase();
  }

  async execute(quarterId: string, schoolId: string, userId?: string): Promise<Quarter> {
    const quarter = await prisma.quarter.findFirst({
      where: {
        id: quarterId,
        deletedAt: null,
      },
      include: {
        schoolYear: true,
      },
    });

    if (!quarter) {
      throw new Error('Quarter not found');
    }

    if (quarter.schoolYear.schoolId !== schoolId) {
      throw new Error('Quarter does not belong to the specified school');
    }

    if (quarter.isClosed) {
      throw new Error('Quarter is already closed');
    }

    const now = new Date();
    const gracePeriodEnd = new Date(quarter.endDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

    if (now > gracePeriodEnd) {
      if (userId) {
        throw new Error('Grace period has ended. Quarter can only be closed automatically.');
      }
    } else if (now <= quarter.endDate) {
      throw new Error('Quarter has not ended yet. Cannot close before end date.');
    }

    const closedQuarter = await prisma.quarter.update({
      where: { id: quarterId },
      data: {
        isClosed: true,
        closedAt: now,
        closedBy: userId || null,
      },
      include: {
        quarterHolidays: true,
        schoolWeeks: true,
      },
    });

    try {
      await this.redistributeUseCase.execute(quarterId, schoolId);
    } catch (error) {
      console.error('Error redistributing unfinished paces:', error);
    }

    return QuarterMapper.toDomain(closedQuarter);
  }
}

