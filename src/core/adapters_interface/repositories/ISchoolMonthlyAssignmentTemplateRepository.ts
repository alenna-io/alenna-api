import type { SchoolMonthlyAssignmentTemplate } from '../../domain/entities';

export interface ISchoolMonthlyAssignmentTemplateRepository {
  findBySchoolYearId(schoolYearId: string): Promise<SchoolMonthlyAssignmentTemplate[]>;
}