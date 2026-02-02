import { PaceCatalog } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaTransaction } from '../../../infrastructure/database/PrismaTransaction';

export interface IPaceCatalogRepository {
  findById(id: string, tx?: PrismaTransaction): Promise<Prisma.PaceCatalogGetPayload<{ include: { subject: { include: { category: true } } } }> | null>;
  findByCodeAndSubjectId(code: string, subjectId: string, tx?: PrismaTransaction): Promise<PaceCatalog | null>;
  findByCodesAndSubjects(codes: string[], subjectIds: string[], tx?: PrismaTransaction): Promise<Map<string, PaceCatalog>>;
  findByCategoryAndOrderRange(categoryId: string, startPace: number, endPace: number, subjectId: string, tx?: PrismaTransaction): Promise<PaceCatalog[]>;
  findByCategory(categoryName: string, tx?: PrismaTransaction): Promise<Prisma.PaceCatalogGetPayload<{ include: { subject: { include: { category: true; level: true } } } }>[]>;
}
