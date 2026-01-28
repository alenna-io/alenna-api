import { CreateProjectionInput } from '../../application/dtos/projections/CreateProjectionInput';
import { ProjectionWithStudent, ProjectionWithDetails } from './types/projections.types';
import prisma from '../database/prisma.client';
import { PrismaTransaction } from '../database/PrismaTransaction';
import { Prisma } from '@prisma/client';
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
}
