import { Category } from '@prisma/client';
import { PrismaTransaction } from '../../../infrastructure/database/PrismaTransaction';

export interface ICategoryRepository {
  findManyByIds(ids: string[], tx?: PrismaTransaction): Promise<Category[]>;
  findAllWithSubjects(tx?: PrismaTransaction): Promise<Category[]>;
  assertContiguousPaceRange(categoryId: string, startPace: number, endPace: number, subjectId?: string | null, tx?: PrismaTransaction): Promise<void>;
}