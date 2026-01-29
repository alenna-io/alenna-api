import { PrismaTransaction } from '../../../infrastructure/database/PrismaTransaction';
import { Prisma } from '@prisma/client';
import type {
  CreateMonthlyGoalTemplateInput,
  UpdateMonthlyGoalTemplateInput,
  CreateQuarterPercentageInput,
  UpdateQuarterPercentageInput,
} from '../../../application/dtos/monthly-goals';

export interface IMonthlyGoalRepository {
  createTemplate(
    schoolYearId: string,
    schoolId: string,
    input: CreateMonthlyGoalTemplateInput,
    tx?: PrismaTransaction
  ): Promise<Prisma.MonthlyGoalTemplateGetPayload<{}>>;

  findTemplatesBySchoolYear(
    schoolYearId: string,
    tx?: PrismaTransaction
  ): Promise<Prisma.MonthlyGoalTemplateGetPayload<{}>[]>;

  updateTemplate(
    templateId: string,
    schoolId: string,
    input: UpdateMonthlyGoalTemplateInput,
    tx?: PrismaTransaction
  ): Promise<Prisma.MonthlyGoalTemplateGetPayload<{}>>;

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
  ): Promise<Prisma.ProjectionMonthlyGoalGetPayload<{
    include: {
      monthlyGoalTemplate: true;
      gradeHistory: true;
    };
  }>[]>;

  updateGrade(
    projectionId: string,
    monthlyGoalId: string,
    grade: number,
    tx?: PrismaTransaction
  ): Promise<Prisma.ProjectionMonthlyGoalGetPayload<{}>>;

  markUngraded(
    projectionId: string,
    monthlyGoalId: string,
    tx?: PrismaTransaction
  ): Promise<Prisma.ProjectionMonthlyGoalGetPayload<{}>>;
}
