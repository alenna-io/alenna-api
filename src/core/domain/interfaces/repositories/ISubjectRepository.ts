import { PrismaTransaction } from '../../../infrastructure/database/PrismaTransaction';
import { Prisma } from '@prisma/client';

export interface ISubjectRepository {
  findById(id: string, tx?: PrismaTransaction): Promise<Prisma.SubjectGetPayload<{}> | null>;
  findManyByIds(ids: string[], tx?: PrismaTransaction): Promise<Prisma.SubjectGetPayload<{}>[]>;
  findBySubjectAndNextLevelsWithPaces(
    subjectId: string,
    levelsCount: number,
    tx?: PrismaTransaction
  ): Promise<Prisma.SubjectGetPayload<{ include: { paces: true } }>[]>;
} 