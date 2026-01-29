import { IStudentRepository } from '../../domain/interfaces/repositories';
import prisma from '../database/prisma.client';
import { PrismaTransaction } from '../database/PrismaTransaction';
import { Prisma, ProjectionStatus } from '@prisma/client';

export class PrismaStudentRepository implements IStudentRepository {
  async findById(id: string, schoolId: string, tx: PrismaTransaction = prisma): Promise<Prisma.StudentGetPayload<{}> | null> {
    return await tx.student.findFirst({
      where: {
        id,
        schoolId,
      },
    });
  }

  async findEnrolledWithoutOpenProjectionBySchoolId(schoolId: string, tx: PrismaTransaction = prisma): Promise<Prisma.StudentGetPayload<{}>[]> {
    return await tx.student.findMany({
      where: {
        schoolId,
        projections: {
          none: {
            status: ProjectionStatus.OPEN,
          },
        },
      },
      include: {
        user: true,
      }
    });
  }
}
