import prisma from '../database/prisma.client';
import { PrismaTransaction } from '../database/PrismaTransaction';
import { Prisma } from '@prisma/client';
import { ISubjectRepository } from '../../domain/interfaces/repositories';

export class PrismaSubjectRepository implements ISubjectRepository {
  async findById(id: string, tx: PrismaTransaction = prisma): Promise<Prisma.SubjectGetPayload<{}> | null> {
    return await tx.subject.findUnique({
      where: { id },
    });
  }

  async findManyByIds(ids: string[], tx: PrismaTransaction = prisma): Promise<Prisma.SubjectGetPayload<{}>[]> {
    return await tx.subject.findMany({
      where: { id: { in: ids } },
    });
  }

  async findBySubjectAndNextLevelsWithPaces(
    subjectId: string,
    levelsCount: number = 2,
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.SubjectGetPayload<{ include: { paces: true; level: true } }>[]> {
    // 1. Find the current subject with its level
    const currentSubject = await tx.subject.findUnique({
      where: { id: subjectId },
      include: { level: true },
    });

    if (!currentSubject || !currentSubject.level.number) {
      return [];
    }

    const currentLevelNumber = currentSubject.level.number;
    const categoryId = currentSubject.categoryId;

    // 2. Find subjects in the same category with levels: current, current+1, ..., current+levelsCount
    const targetLevelNumbers = Array.from(
      { length: levelsCount + 1 },
      (_, i) => currentLevelNumber + i
    );

    return await tx.subject.findMany({
      where: {
        categoryId,
        level: {
          number: { in: targetLevelNumbers },
        },
      },
      include: {
        paces: {
          orderBy: { orderIndex: 'asc' },
        },
        level: true,
      },
      orderBy: {
        level: {
          number: 'asc',
        },
      },
    });
  }
}
