import { PaceCatalog } from '@prisma/client';
import { PrismaTransaction } from '../../../infrastructure/database/PrismaTransaction';

export interface IPaceCatalogRepository {
  findByCodeAndSubjectId(code: string, subjectId: string, tx?: PrismaTransaction): Promise<PaceCatalog | null>;
  findByCodesAndSubjects(codes: string[], subjectIds: string[], tx?: PrismaTransaction): Promise<Map<string, PaceCatalog>>;
  findByCategoryAndOrderRange(categoryId: string, startPace: number, endPace: number, tx?: PrismaTransaction): Promise<PaceCatalog[]>;
}
