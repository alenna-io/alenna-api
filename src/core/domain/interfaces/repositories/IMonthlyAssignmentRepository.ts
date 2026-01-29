import { PrismaTransaction } from '../../../infrastructure/database/PrismaTransaction';
import { Prisma } from '@prisma/client';
import type {
  CreateMonthlyAssignmentTemplateInput,
  UpdateMonthlyAssignmentTemplateInput,
  CreateQuarterPercentageInput,
  UpdateQuarterPercentageInput,
} from '../../../application/dtos/monthly-assignments';

export interface IMonthlyAssignmentRepository {
  createTemplate(
    schoolYearId: string,
    schoolId: string,
    input: CreateMonthlyAssignmentTemplateInput,
    tx?: PrismaTransaction
  ): Promise<Prisma.MonthlyAssignmentTemplateGetPayload<{}>>;

  findTemplatesBySchoolYear(
    schoolYearId: string,
    tx?: PrismaTransaction
  ): Promise<Prisma.MonthlyAssignmentTemplateGetPayload<{}>[]>;

  updateTemplate(
    templateId: string,
    schoolId: string,
    input: UpdateMonthlyAssignmentTemplateInput,
    tx?: PrismaTransaction
  ): Promise<Prisma.MonthlyAssignmentTemplateGetPayload<{}>>;

  deleteTemplate(
    templateId: string,
    schoolId: string,
    tx?: PrismaTransaction
  ): Promise<void>;

  createPercentage(
    schoolYearId: string,
    schoolId: string,
    input: CreateQuarterPercentageInput,
    tx?: PrismaTransaction
  ): Promise<Prisma.QuarterGradePercentageGetPayload<{}>>;

  findPercentagesBySchoolYear(
    schoolYearId: string,
    tx?: PrismaTransaction
  ): Promise<Prisma.QuarterGradePercentageGetPayload<{}>[]>;

  updatePercentage(
    percentageId: string,
    schoolId: string,
    input: UpdateQuarterPercentageInput,
    tx?: PrismaTransaction
  ): Promise<Prisma.QuarterGradePercentageGetPayload<{}>>;

  findByProjection(
    projectionId: string,
    tx?: PrismaTransaction
  ): Promise<Prisma.ProjectionMonthlyAssignmentGetPayload<{
    include: {
      monthlyAssignmentTemplate: true;
      gradeHistory: true;
    };
  }>[]>;

  updateGrade(
    projectionId: string,
    monthlyAssignmentId: string,
    grade: number,
    tx?: PrismaTransaction
  ): Promise<Prisma.ProjectionMonthlyAssignmentGetPayload<{}>>;

  markUngraded(
    projectionId: string,
    monthlyAssignmentId: string,
    tx?: PrismaTransaction
  ): Promise<Prisma.ProjectionMonthlyAssignmentGetPayload<{}>>;
}
