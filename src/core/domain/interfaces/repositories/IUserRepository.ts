import { PrismaTransaction } from '../../../infrastructure/database/PrismaTransaction';
import { Prisma } from '@prisma/client';

export interface IUserRepository {
  findById(id: string, tx?: PrismaTransaction): Promise<Prisma.UserGetPayload<{}> | null>;
  findByIdWithRelations(id: string, tx?: PrismaTransaction): Promise<Prisma.UserGetPayload<{
    include: {
      school: true;
      userRoles: {
        include: {
          role: true;
        };
      };
      student: true;
    };
  }> | null>;
  updateCreatedPassword(userId: string, createdPassword: boolean, tx?: PrismaTransaction): Promise<Prisma.UserGetPayload<{}>>;
}
