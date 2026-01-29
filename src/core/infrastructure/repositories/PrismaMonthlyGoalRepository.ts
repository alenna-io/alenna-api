import prisma from '../database/prisma.client';
import { PrismaTransaction } from '../database/PrismaTransaction';
import { Prisma, ProjectionMonthlyGoalStatus } from '@prisma/client';
import { IMonthlyGoalRepository } from '../../domain/interfaces/repositories/IMonthlyGoalRepository';
import type {
  CreateMonthlyGoalTemplateInput,
  UpdateMonthlyGoalTemplateInput,
  CreateQuarterPercentageInput,
  UpdateQuarterPercentageInput,
} from '../../application/dtos/monthly-goals';

export class PrismaMonthlyGoalRepository implements IMonthlyGoalRepository {
  async createTemplate(
    schoolYearId: string,
    schoolId: string,
    input: CreateMonthlyGoalTemplateInput,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.MonthlyGoalTemplateGetPayload<{}>> {
    if (tx === prisma) {
      return await prisma.$transaction(async (transaction) => {
        const template = await transaction.monthlyGoalTemplate.create({
          data: {
            name: input.name,
            quarter: input.quarter,
            schoolYearId,
            schoolId,
          },
        });

        const projections = await transaction.projection.findMany({
          where: {
            schoolId,
            schoolYear: schoolYearId,
            deletedAt: null,
          },
        });

        if (projections.length > 0) {
          await transaction.projectionMonthlyGoal.createMany({
            data: projections.map((projection) => ({
              projectionId: projection.id,
              monthlyGoalTemplateId: template.id,
              status: ProjectionMonthlyGoalStatus.PENDING,
            })),
            skipDuplicates: true,
          });
        }

        return template;
      });
    } else {
      const template = await tx.monthlyGoalTemplate.create({
        data: {
          name: input.name,
          quarter: input.quarter,
          schoolYearId,
          schoolId,
        },
      });

      const projections = await tx.projection.findMany({
        where: {
          schoolId,
          schoolYear: schoolYearId,
          deletedAt: null,
        },
      });

      if (projections.length > 0) {
        await tx.projectionMonthlyGoal.createMany({
          data: projections.map((projection) => ({
            projectionId: projection.id,
            monthlyGoalTemplateId: template.id,
            status: ProjectionMonthlyGoalStatus.PENDING,
          })),
          skipDuplicates: true,
        });
      }

      return template;
    }
  }

  async findTemplatesBySchoolYear(
    schoolYearId: string,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.MonthlyGoalTemplateGetPayload<{}>[]> {
    return await tx.monthlyGoalTemplate.findMany({
      where: {
        schoolYearId,
        deletedAt: null,
      },
      orderBy: [
        { quarter: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async updateTemplate(
    templateId: string,
    schoolId: string,
    input: UpdateMonthlyGoalTemplateInput,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.MonthlyGoalTemplateGetPayload<{}>> {
    return await tx.monthlyGoalTemplate.update({
      where: {
        id: templateId,
        schoolId,
        deletedAt: null,
      },
      data: {
        name: input.name,
      },
    });
  }

  async deleteTemplate(
    templateId: string,
    schoolId: string,
    tx: PrismaTransaction = prisma
  ): Promise<void> {
    await tx.monthlyGoalTemplate.update({
      where: {
        id: templateId,
        schoolId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async createPercentage(
    schoolYearId: string,
    schoolId: string,
    input: CreateQuarterPercentageInput,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.QuarterGradePercentageGetPayload<{}>> {
    return await tx.quarterGradePercentage.upsert({
      where: {
        schoolYearId_quarter: {
          schoolYearId,
          quarter: input.quarter,
        },
      },
      create: {
        percentage: input.percentage,
        quarter: input.quarter,
        schoolYearId,
        schoolId,
      },
      update: {
        percentage: input.percentage,
      },
    });
  }

  async findPercentagesBySchoolYear(
    schoolYearId: string,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.QuarterGradePercentageGetPayload<{}>[]> {
    return await tx.quarterGradePercentage.findMany({
      where: {
        schoolYearId,
        deletedAt: null,
      },
      orderBy: {
        quarter: 'asc',
      },
    });
  }

  async updatePercentage(
    percentageId: string,
    schoolId: string,
    input: UpdateQuarterPercentageInput,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.QuarterGradePercentageGetPayload<{}>> {
    return await tx.quarterGradePercentage.update({
      where: {
        id: percentageId,
        schoolId,
        deletedAt: null,
      },
      data: {
        percentage: input.percentage,
      },
    });
  }

  async findByProjection(
    projectionId: string,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.ProjectionMonthlyGoalGetPayload<{
    include: {
      monthlyGoalTemplate: true;
      gradeHistory: true;
    };
  }>[]> {
    return await tx.projectionMonthlyGoal.findMany({
      where: {
        projectionId,
        deletedAt: null,
      },
      include: {
        monthlyGoalTemplate: true,
        gradeHistory: {
          orderBy: {
            date: 'desc',
          },
        },
      },
      orderBy: [
        {
          monthlyGoalTemplate: {
            quarter: 'asc',
          },
        },
        {
          monthlyGoalTemplate: {
            name: 'asc',
          },
        },
      ],
    });
  }

  async updateGrade(
    projectionId: string,
    monthlyGoalId: string,
    grade: number,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.ProjectionMonthlyGoalGetPayload<{}>> {
    const status = grade >= 80 ? ProjectionMonthlyGoalStatus.COMPLETED : ProjectionMonthlyGoalStatus.FAILED;

    await tx.monthlyGoalGradeHistory.create({
      data: {
        projectionMonthlyGoalId: monthlyGoalId,
        grade,
        note: null,
      },
    });

    return await tx.projectionMonthlyGoal.update({
      where: {
        id: monthlyGoalId,
        projectionId,
        deletedAt: null,
      },
      data: {
        grade,
        status,
      },
    });
  }

  async markUngraded(
    projectionId: string,
    monthlyGoalId: string,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.ProjectionMonthlyGoalGetPayload<{}>> {
    return await tx.projectionMonthlyGoal.update({
      where: {
        id: monthlyGoalId,
        projectionId,
        deletedAt: null,
      },
      data: {
        grade: null,
        status: ProjectionMonthlyGoalStatus.PENDING,
      },
    });
  }
}
