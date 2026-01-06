import { PaceCatalog } from '../../../domain/entities/v2/PaceCatalog';
import { PrismaTransaction } from '../../../frameworks/database/PrismaTransaction';

export interface PaceCatalogRepository {
  findByCodeAndSubSubjectId(
    code: string,
    subSubjectId: string,
    tx?: PrismaTransaction
  ): Promise<PaceCatalog | null>;
  findByCodesAndSubSubjects(
    codes: string[],
    subSubjectIds: string[],
    tx?: PrismaTransaction
  ): Promise<Map<string, PaceCatalog>>;
}