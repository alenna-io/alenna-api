import type { ISchoolYearRepository } from '../../../adapters_interface/repositories';
import type { SchoolYearOutput, QuarterOutput } from '../../dtos';

export class SetActiveSchoolYearUseCase {
  constructor(private schoolYearRepository: ISchoolYearRepository) {}

  async execute(id: string, schoolId: string): Promise<SchoolYearOutput> {
    const schoolYear = await this.schoolYearRepository.setActive(id, schoolId);
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
        createdAt: q.createdAt.toISOString(),
        updatedAt: q.updatedAt.toISOString(),
      })),
      createdAt: schoolYear.createdAt.toISOString(),
      updatedAt: schoolYear.updatedAt.toISOString(),
    };
  }
}

