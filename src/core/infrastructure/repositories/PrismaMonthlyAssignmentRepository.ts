import prisma from '../database/prisma.client';
import { PrismaTransaction } from '../database/PrismaTransaction';
import { Prisma, ProjectionMonthlyAssignmentStatus } from '@prisma/client';
import { IMonthlyAssignmentRepository } from '../../domain/interfaces/repositories/IMonthlyAssignmentRepository';
import type {
  CreateMonthlyAssignmentTemplateInput,
  UpdateMonthlyAssignmentTemplateInput,
  CreateQuarterPercentageInput,
  UpdateQuarterPercentageInput,
} from '../../application/dtos/monthly-assignments';

export class PrismaMonthlyAssignmentRepository implements IMonthlyAssignmentRepository {
  async createTemplate(
    schoolYearId: string,
    schoolId: string,
    input: CreateMonthlyAssignmentTemplateInput,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.MonthlyAssignmentTemplateGetPayload<{}>> {
    if (tx === prisma) {
      return await prisma.$transaction(async (transaction) => {
        const template = await transaction.monthlyAssignmentTemplate.create({
          data: {
            name: input.name,
            quarter: input.quarter,
            month: input.month,
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
          await transaction.projectionMonthlyAssignment.createMany({
            data: projections.map((projection) => ({
              projectionId: projection.id,
              monthlyAssignmentTemplateId: template.id,
              status: ProjectionMonthlyAssignmentStatus.PENDING,
            })),
            skipDuplicates: true,
          });
        }

        return template;
      });
    } else {
      const template = await tx.monthlyAssignmentTemplate.create({
        data: {
          name: input.name,
          quarter: input.quarter,
          month: input.month,
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
        await tx.projectionMonthlyAssignment.createMany({
          data: projections.map((projection) => ({
            projectionId: projection.id,
            monthlyAssignmentTemplateId: template.id,
            status: ProjectionMonthlyAssignmentStatus.PENDING,
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
  ): Promise<Prisma.MonthlyAssignmentTemplateGetPayload<{}>[]> {
    return await tx.monthlyAssignmentTemplate.findMany({
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
    input: UpdateMonthlyAssignmentTemplateInput,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.MonthlyAssignmentTemplateGetPayload<{}>> {
    return await tx.monthlyAssignmentTemplate.update({
      where: {
        id: templateId,
        schoolId,
        deletedAt: null,
      },
      data: {
        name: input.name,
        month: input.month,
      },
    });
  }

  async deleteTemplate(
    templateId: string,
    schoolId: string,
    tx: PrismaTransaction = prisma
  ): Promise<void> {
    if (tx === prisma) {
      await prisma.$transaction(async (transaction) => {
        // Delete projection monthly assignments that have no grades
        await transaction.projectionMonthlyAssignment.deleteMany({
          where: {
            monthlyAssignmentTemplateId: templateId,
            grade: null,
            deletedAt: null,
          },
        });

        // Soft delete the template
        await transaction.monthlyAssignmentTemplate.update({
          where: {
            id: templateId,
            schoolId,
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
          },
        });
      });
    } else {
      // Delete projection monthly assignments that have no grades
      await tx.projectionMonthlyAssignment.deleteMany({
        where: {
          monthlyAssignmentTemplateId: templateId,
          grade: null,
          deletedAt: null,
        },
      });

      // Soft delete the template
      await tx.monthlyAssignmentTemplate.update({
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
  ): Promise<Prisma.ProjectionMonthlyAssignmentGetPayload<{
    include: {
      monthlyAssignmentTemplate: true;
      gradeHistory: true;
    };
  }>[]> {
    return await tx.projectionMonthlyAssignment.findMany({
      where: {
        projectionId,
        deletedAt: null,
      },
      include: {
        monthlyAssignmentTemplate: true,
        gradeHistory: {
          orderBy: {
            date: 'desc',
          },
        },
      },
      orderBy: [
        {
          monthlyAssignmentTemplate: {
            quarter: 'asc',
          },
        },
        {
          monthlyAssignmentTemplate: {
            name: 'asc',
          },
        },
      ],
    });
  }

  async updateGrade(
    projectionId: string,
    monthlyAssignmentId: string,
    grade: number,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.ProjectionMonthlyAssignmentGetPayload<{}>> {
    const status = grade >= 80 ? ProjectionMonthlyAssignmentStatus.COMPLETED : ProjectionMonthlyAssignmentStatus.FAILED;

    await tx.monthlyAssignmentGradeHistory.create({
      data: {
        projectionMonthlyAssignmentId: monthlyAssignmentId,
        grade,
        note: null,
      },
    });

    return await tx.projectionMonthlyAssignment.update({
      where: {
        id: monthlyAssignmentId,
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
    monthlyAssignmentId: string,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.ProjectionMonthlyAssignmentGetPayload<{}>> {
    return await tx.projectionMonthlyAssignment.update({
      where: {
        id: monthlyAssignmentId,
        projectionId,
        deletedAt: null,
      },
      data: {
        grade: null,
        status: ProjectionMonthlyAssignmentStatus.PENDING,
      },
    });
  }

  async hasTemplateAssignmentsWithGrades(
    templateId: string,
    tx: PrismaTransaction = prisma
  ): Promise<boolean> {
    const count = await tx.projectionMonthlyAssignment.count({
      where: {
        monthlyAssignmentTemplateId: templateId,
        grade: {
          not: null,
        },
        deletedAt: null,
      },
    });
    return count > 0;
  }
}
