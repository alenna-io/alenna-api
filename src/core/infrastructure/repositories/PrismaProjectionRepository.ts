import { CreateProjectionInput } from '../../application/dtos/projections/CreateProjectionInput';
import { ProjectionWithStudent, ProjectionWithDetails } from './types/projections.types';
import prisma from '../database/prisma.client';
import { PrismaTransaction } from '../database/PrismaTransaction';
import { Prisma, ProjectionPaceStatus } from '@prisma/client';
import { IProjectionRepository } from '../../domain/interfaces/repositories';

export class PrismaProjectionRepository implements IProjectionRepository {

  async findActiveByStudent(
    studentId: string,
    schoolId: string,
    schoolYear: string,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.ProjectionGetPayload<{}> | null> {
    return await tx.projection.findFirst({
      where: {
        studentId,
        schoolId,
        schoolYear,
        status: 'OPEN',
      },
    });
  }

  async create(
    { studentId, schoolId, schoolYear }: CreateProjectionInput,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.ProjectionGetPayload<{}>> {
    return await tx.projection.create({
      data: {
        studentId,
        schoolId,
        schoolYear
      },
    });
  }

  async findManyBySchoolId(
    schoolId: string,
    schoolYear?: string,
    tx: PrismaTransaction = prisma
  ): Promise<ProjectionWithStudent[]> {
    const where: Prisma.ProjectionWhereInput = {
      schoolId,
      deletedAt: null,
    };

    if (schoolYear) {
      where.schoolYear = schoolYear;
    }

    return await tx.projection.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            projectionPaces: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }) as ProjectionWithStudent[];
  }

  async findById(
    id: string,
    tx: PrismaTransaction = prisma
  ): Promise<ProjectionWithDetails | null> {
    return await tx.projection.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        projectionPaces: {
          where: {
            deletedAt: null,
          },
          include: {
            paceCatalog: {
              include: {
                subject: {
                  include: {
                    category: true,
                  },
                },
              },
            },
            gradeHistory: {
              orderBy: {
                date: 'desc',
              },
            },
          },
          orderBy: [
            { quarter: 'asc' },
            { week: 'asc' },
          ],
        },
        dailyGoals: {
          where: {
            deletedAt: null,
          },
          orderBy: [
            { quarter: 'asc' },
            { week: 'asc' },
            { dayOfWeek: 'asc' },
          ],
        },
      },
    }) as ProjectionWithDetails | null;
  }

  async movePace(
    projectionId: string,
    paceId: string,
    quarter: string,
    week: number,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.ProjectionPaceGetPayload<{}>> {
    return await tx.projectionPace.update({
      where: {
        id: paceId,
        projectionId,
        deletedAt: null,
      },
      data: {
        quarter,
        week,
      },
    });
  }

  async addPace(
    projectionId: string,
    paceCatalogId: string,
    quarter: string,
    week: number,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.ProjectionPaceGetPayload<{}>> {
    const softDeletedPace = await tx.projectionPace.findFirst({
      where: {
        projectionId,
        paceCatalogId,
        deletedAt: { not: null },
      },
    });

    if (softDeletedPace) {
      return await tx.projectionPace.update({
        where: {
          id: softDeletedPace.id,
        },
        data: {
          deletedAt: null,
          quarter,
          week,
        },
      });
    }

    return await tx.projectionPace.create({
      data: {
        projectionId,
        paceCatalogId,
        quarter,
        week,
      },
    });
  }

  async restorePace(
    paceId: string,
    quarter: string,
    week: number,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.ProjectionPaceGetPayload<{}>> {
    return await tx.projectionPace.update({
      where: {
        id: paceId,
      },
      data: {
        deletedAt: null,
        quarter,
        week,
      },
    });
  }

  async deletePace(
    projectionId: string,
    paceId: string,
    tx: PrismaTransaction = prisma
  ): Promise<void> {
    await tx.projectionPace.update({
      where: {
        id: paceId,
        projectionId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async updateGrade(
    projectionId: string,
    paceId: string,
    grade: number,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.ProjectionPaceGetPayload<{}>> {
    const status = grade >= 80 ? ProjectionPaceStatus.COMPLETED : ProjectionPaceStatus.FAILED;

    await tx.gradeHistory.create({
      data: {
        projectionPaceId: paceId,
        grade,
        note: null,
      },
    });

    return await tx.projectionPace.update({
      where: {
        id: paceId,
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
    paceId: string,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.ProjectionPaceGetPayload<{}>> {
    return await tx.projectionPace.update({
      where: {
        id: paceId,
        projectionId,
        deletedAt: null,
      },
      data: {
        grade: null,
        status: ProjectionPaceStatus.PENDING,
      },
    });
  }
}
