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

    if (!currentSubject) {
      return [];
    }

    const categoryId = currentSubject.categoryId;
    const currentLevelNumber = currentSubject.level?.number;

    // If the subject doesn't have a level number (e.g., electives that can be at any level),
    // just return the current subject with its paces
    if (currentLevelNumber === null || currentLevelNumber === undefined) {
      const subjectWithPaces = await tx.subject.findUnique({
        where: { id: subjectId },
        select: {
          id: true,
          name: true,
          level: {
            select: {
              id: true,
              number: true,
              name: true,
            },
          },
          paces: {
            select: {
              id: true,
              code: true,
              name: true,
              orderIndex: true,
            },
            orderBy: { orderIndex: 'asc' },
          },
        },
      }) as Prisma.SubjectGetPayload<{ include: { paces: true; level: true } }> | null;

      if (!subjectWithPaces) {
        return [];
      }

      return [subjectWithPaces];
    }

    // 2. Find subjects in the same category with levels: current, current+1, ..., current+levelsCount
    const targetLevelNumbers = Array.from(
      { length: levelsCount + 1 },
      (_, i) => currentLevelNumber + i
    );

    const subjects = await tx.subject.findMany({
      where: {
        categoryId,
        level: {
          number: { in: targetLevelNumbers },
        },
      },
      select: {
        id: true,
        name: true,
        level: {
          select: {
            id: true,
            number: true,
            name: true,
          },
        },
        paces: {
          select: {
            id: true,
            code: true,
            name: true,
            orderIndex: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: {
        level: {
          number: 'asc',
        },
      },
    }) as Prisma.SubjectGetPayload<{ include: { paces: true; level: true } }>[];

    return subjects;
  }
}
