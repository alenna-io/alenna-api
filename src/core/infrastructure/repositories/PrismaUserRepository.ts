import { IUserRepository } from '../../domain/interfaces/repositories';
import prisma from '../database/prisma.client';
import { PrismaTransaction } from '../database/PrismaTransaction';
import { Prisma } from '@prisma/client';

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string, tx: PrismaTransaction = prisma): Promise<Prisma.UserGetPayload<{}> | null> {
    return await tx.user.findUnique({
      where: { id },
    });
  }

  async findByIdWithRelations(id: string, tx: PrismaTransaction = prisma): Promise<Prisma.UserGetPayload<{
    include: {
      school: true;
      userRoles: {
        include: {
          role: true;
        };
      };
      student: true;
    };
  }> | null> {
    return await tx.user.findUnique({
      where: { id },
      include: {
        school: true,
        userRoles: {
          include: {
            role: true,
          },
        },
        student: true,
      },
    });
  }

  async updateCreatedPassword(userId: string, createdPassword: boolean, tx: PrismaTransaction = prisma): Promise<Prisma.UserGetPayload<{}>> {
    return await tx.user.update({
      where: { id: userId },
      data: { createdPassword },
    });
  }
}
