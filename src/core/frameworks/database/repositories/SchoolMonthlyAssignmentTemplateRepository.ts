import { ISchoolMonthlyAssignmentTemplateRepository } from '../../../adapters_interface/repositories';
import { SchoolMonthlyAssignmentTemplate } from '../../../domain/entities';
import prisma from '../prisma.client';

export class SchoolMonthlyAssignmentTemplateRepository implements ISchoolMonthlyAssignmentTemplateRepository {
  async findBySchoolYearId(schoolYearId: string): Promise<SchoolMonthlyAssignmentTemplate[]> {
    const schoolMonthlyAssignmentTemplates = await prisma.schoolMonthlyAssignmentTemplate.findMany({
      where: { schoolYearId, deletedAt: null },
    });
    return schoolMonthlyAssignmentTemplates.map(sma => new SchoolMonthlyAssignmentTemplate(
      sma.id,
      sma.name,
      sma.quarter,
      sma.schoolYearId,
      sma.createdAt,
      sma.updatedAt,
      sma.deletedAt ?? undefined
    ));
  }
}