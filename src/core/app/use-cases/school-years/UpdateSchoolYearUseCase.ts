import type { ISchoolYearRepository } from '../../../adapters_interface/repositories';
import type { UpdateSchoolYearInput, SchoolYearOutput, QuarterOutput } from '../../dtos';

export class UpdateSchoolYearUseCase {
  constructor(private schoolYearRepository: ISchoolYearRepository) {}

  async execute(id: string, input: UpdateSchoolYearInput): Promise<SchoolYearOutput> {
    const updateData: any = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.startDate !== undefined) updateData.startDate = new Date(input.startDate);
    if (input.endDate !== undefined) updateData.endDate = new Date(input.endDate);
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    
    if (input.quarters) {
      updateData.quarters = input.quarters.map(q => ({
        id: q.id,
        name: q.name,
        displayName: q.displayName,
        startDate: q.startDate ? new Date(q.startDate) : undefined,
        endDate: q.endDate ? new Date(q.endDate) : undefined,
        order: q.order,
        weeksCount: q.weeksCount,
      }));
    }

    const schoolYear = await this.schoolYearRepository.update(id, updateData);
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

