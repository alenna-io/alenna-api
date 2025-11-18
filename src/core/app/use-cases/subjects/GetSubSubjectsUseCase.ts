import prisma from '../../../frameworks/database/prisma.client';

export interface SubSubjectItem {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  levelId: string;
  levelName: string;
  levelNumber?: number;
  difficulty: number;
}

export class GetSubSubjectsUseCase {
  async execute(): Promise<SubSubjectItem[]> {
    const subSubjects = await prisma.subSubject.findMany({
      include: {
        category: true,
        level: true,
      },
      orderBy: [
        { category: { displayOrder: 'asc' } },
        { level: { number: 'asc' } },
        { name: 'asc' },
      ],
    });

    return subSubjects.map(subSubject => ({
      id: subSubject.id,
      name: subSubject.name,
      categoryId: subSubject.categoryId,
      categoryName: subSubject.category.name,
      levelId: subSubject.levelId,
      levelName: subSubject.level.name,
      levelNumber: subSubject.level.number ?? undefined,
      difficulty: subSubject.difficulty,
    }));
  }
}

