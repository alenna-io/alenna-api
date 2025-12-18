import type { ISchoolYearRepository } from '../../../adapters_interface/repositories';
import type { SchoolYearOutput, QuarterOutput } from '../../dtos';

export class GetSchoolYearsUseCase {
  constructor(private schoolYearRepository: ISchoolYearRepository) { }

  async execute(schoolId: string): Promise<SchoolYearOutput[]> {
    const schoolYears = await this.schoolYearRepository.findBySchoolId(schoolId);
    return schoolYears.map(this.toOutput);
  }

  private toOutput(schoolYear: any): SchoolYearOutput {
    return {
      id: schoolYear.id,
      schoolId: schoolYear.schoolId,
      name: schoolYear.name,
      startDate: schoolYear.startDate.toISOString(),
      endDate: schoolYear.endDate.toISOString(),
      isActive: schoolYear.isActive,
      quarters: schoolYear.quarters?.map((q: any): QuarterOutput => ({
        id: q.id,
        schoolYearId: q.schoolYearId,
        name: q.name,
        displayName: q.displayName,
        startDate: q.startDate.toISOString(),
        endDate: q.endDate.toISOString(),
        order: q.order,
        weeksCount: q.weeksCount,
        holidays: (q.holidays || []).map((h: any) => ({
          id: h.id,
          startDate: h.startDate.toISOString(),
          endDate: h.endDate.toISOString(),
          label: h.label || undefined,
        })),
        weeks: (q.schoolWeeks || []).map((w: any) => ({
          weekNumber: w.weekNumber,
          startDate: w.startDate.toISOString(),
          endDate: w.endDate.toISOString(),
        })),
        createdAt: q.createdAt.toISOString(),
        updatedAt: q.updatedAt.toISOString(),
      })),
      createdAt: schoolYear.createdAt.toISOString(),
      updatedAt: schoolYear.updatedAt.toISOString(),
    };
  }
}

