import type { ISchoolYearRepository } from '../../../adapters_interface/repositories';
import type { CurrentWeekOutput, SchoolYearOutput, QuarterOutput } from '../../dtos';

export class GetCurrentWeekUseCase {
  constructor(private schoolYearRepository: ISchoolYearRepository) {}

  async execute(schoolId: string): Promise<CurrentWeekOutput | null> {
    const currentWeekInfo = await this.schoolYearRepository.getCurrentWeek(schoolId);
    
    if (!currentWeekInfo) {
      return null;
    }

    return {
      schoolYear: this.toSchoolYearOutput(currentWeekInfo.schoolYear),
      currentQuarter: currentWeekInfo.currentQuarter ? this.toQuarterOutput(currentWeekInfo.currentQuarter) : null,
      currentWeek: currentWeekInfo.currentWeek,
      weekStartDate: currentWeekInfo.weekStartDate?.toISOString() || null,
      weekEndDate: currentWeekInfo.weekEndDate?.toISOString() || null,
    };
  }

  private toSchoolYearOutput(schoolYear: any): SchoolYearOutput {
    return {
      id: schoolYear.id,
      schoolId: schoolYear.schoolId,
      name: schoolYear.name,
      startDate: schoolYear.startDate.toISOString(),
      endDate: schoolYear.endDate.toISOString(),
      isActive: schoolYear.isActive,
      quarters: schoolYear.quarters?.map((q: any) => this.toQuarterOutput(q)),
      createdAt: schoolYear.createdAt.toISOString(),
      updatedAt: schoolYear.updatedAt.toISOString(),
    };
  }

  private toQuarterOutput(quarter: any): QuarterOutput {
    return {
      id: quarter.id,
      schoolYearId: quarter.schoolYearId,
      name: quarter.name,
      displayName: quarter.displayName,
      startDate: quarter.startDate.toISOString(),
      endDate: quarter.endDate.toISOString(),
      order: quarter.order,
      weeksCount: quarter.weeksCount,
      createdAt: quarter.createdAt.toISOString(),
      updatedAt: quarter.updatedAt.toISOString(),
    };
  }
}

