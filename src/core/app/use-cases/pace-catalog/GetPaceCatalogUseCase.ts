import prisma from '../../../frameworks/database/prisma.client';

export interface PaceCatalogItem {
  id: string;
  code: string;
  name: string;
  subSubjectName: string;
  categoryName: string;
  levelId: string;
  difficulty: number;
}

export interface GetPaceCatalogFilters {
  categoryName?: string;
  levelId?: string;
  subSubjectId?: string;
}

export class GetPaceCatalogUseCase {
  async execute(filters: GetPaceCatalogFilters = {}): Promise<PaceCatalogItem[]> {
    const paces = await prisma.paceCatalog.findMany({
      where: {
        ...(filters.subSubjectId && { subSubjectId: filters.subSubjectId }),
        subSubject: {
          ...(filters.categoryName && { 
            category: { 
              name: filters.categoryName 
            } 
          }),
          ...(filters.levelId && { levelId: filters.levelId }),
        },
      },
      include: {
        subSubject: {
          include: {
            category: true,
            level: true,
          },
        },
      },
      orderBy: {
        code: 'asc',
      },
      take: 100, // Limit to prevent huge responses
    });

    return paces.map(pace => ({
      id: pace.id,
      code: pace.code,
      name: pace.name,
      subSubjectName: pace.subSubject.name,
      categoryName: pace.subSubject.category.name,
      levelId: pace.subSubject.levelId,
      difficulty: pace.subSubject.difficulty,
    }));
  }
}

