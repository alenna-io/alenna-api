import { Category } from "../../../domain/entities/v2/Category";
import { PrismaTransaction } from "../../../frameworks/database/PrismaTransaction";

export interface CategoryRepository {
  findManyByIds(ids: string[], tx?: PrismaTransaction): Promise<Category[]>;
  assertContiguousPaceRange(
    categoryId: string,
    startPace: number,
    endPace: number,
    tx?: PrismaTransaction
  ): Promise<void>;
}