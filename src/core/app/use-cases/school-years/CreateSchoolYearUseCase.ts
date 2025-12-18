import type { ISchoolYearRepository } from '../../../adapters_interface/repositories';
import type { CreateSchoolYearInput, SchoolYearOutput, QuarterOutput } from '../../dtos';

export class CreateSchoolYearUseCase {
  constructor(private schoolYearRepository: ISchoolYearRepository) { }

  async execute(input: CreateSchoolYearInput, schoolId: string): Promise<SchoolYearOutput> {
    const schoolYear = await this.schoolYearRepository.create({
      schoolId,
      name: input.name,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      isActive: input.isActive,
      quarters: input.quarters.map(q => ({
        name: q.name,
        displayName: q.displayName,
        startDate: new Date(q.startDate),
        endDate: new Date(q.endDate),
        order: q.order,
        weeksCount: q.weeksCount,
        weeks: q.weeks?.map(w => ({
          weekNumber: w.weekNumber,
          startDate: new Date(w.startDate),
          endDate: new Date(w.endDate),
        })),
        holidays: q.holidays?.map(h => ({
          startDate: new Date(h.startDate),
          endDate: new Date(h.endDate),
          label: h.label,
        })),
      })),
    });

    return this.toOutput(schoolYear);
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

