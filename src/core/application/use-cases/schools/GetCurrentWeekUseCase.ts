import { ISchoolRepository } from '../../../domain/interfaces/repositories';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import {
  DomainError,
  InvalidEntityError,
  ObjectNotFoundError,
} from '../../../domain/errors';
import { CurrentWeekInfo } from '../../dtos/schools';
import { Prisma } from '@prisma/client';

export class GetCurrentWeekUseCase {
  constructor(
    private readonly schoolRepository: ISchoolRepository
  ) { }

  async execute(userId: string): Promise<Result<CurrentWeekInfo | null, DomainError>> {
    try {
      const school = await this.schoolRepository.findSchoolWithCurrentYearByUserId(userId) as Prisma.SchoolGetPayload<{
        include: {
          schoolYears: {
            include: {
              quarters: {
                include: {
                  schoolWeeks: true;
                };
              };
            };
          };
        };
      }> | null;

      if (!school) {
        return Ok(null);
      }

      const schoolYear = school.schoolYears?.[0];
      if (!schoolYear) {
        return Ok(null);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let currentQuarter: (typeof schoolYear.quarters)[0] | null = null;
      let currentWeek: number | null = null;
      let weekStartDate: Date | null = null;
      let weekEndDate: Date | null = null;

      // Find the current week by checking all quarters and their weeks
      for (const quarter of schoolYear.quarters || []) {
        for (const week of quarter.schoolWeeks || []) {
          const weekStart = new Date(week.startDate);
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(week.endDate);
          weekEnd.setHours(23, 59, 59, 999);

          if (today >= weekStart && today <= weekEnd) {
            currentQuarter = quarter;
            currentWeek = week.weekNumber;
            weekStartDate = week.startDate;
            weekEndDate = week.endDate;
            break;
          }
        }
        if (currentWeek !== null) {
          break;
        }
      }

      // If no current week found, find the most recent past week
      if (currentWeek === null) {
        let lastWeek: { quarter: typeof schoolYear.quarters[0]; week: { weekNumber: number; startDate: Date; endDate: Date } } | null = null;

        for (const quarter of schoolYear.quarters || []) {
          for (const week of quarter.schoolWeeks || []) {
            const weekEnd = new Date(week.endDate);
            weekEnd.setHours(23, 59, 59, 999);

            if (today > weekEnd) {
              if (!lastWeek || weekEnd > new Date(lastWeek.week.endDate)) {
                lastWeek = { quarter, week };
              }
            }
          }
        }

        if (lastWeek) {
          currentQuarter = lastWeek.quarter;
          currentWeek = lastWeek.week.weekNumber;
          weekStartDate = lastWeek.week.startDate;
          weekEndDate = lastWeek.week.endDate;
        }
      }

      const result: CurrentWeekInfo = {
        schoolYear: {
          id: schoolYear.id,
          name: schoolYear.name,
          startDate: schoolYear.startDate,
          endDate: schoolYear.endDate,
          quarters: (schoolYear.quarters || []).map((q: typeof schoolYear.quarters[0]) => ({
            id: q.id,
            name: q.name,
            startDate: q.startDate,
            endDate: q.endDate,
            order: q.order,
            weeksCount: q.weeksCount,
          })),
        },
        currentQuarter: currentQuarter ? {
          id: currentQuarter.id,
          name: currentQuarter.name,
          startDate: currentQuarter.startDate,
          endDate: currentQuarter.endDate,
          order: currentQuarter.order,
          weeksCount: currentQuarter.weeksCount,
        } : null,
        currentWeek,
        weekStartDate,
        weekEndDate,
      };

      return Ok(result);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}
