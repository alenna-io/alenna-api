import { CategoryRepository } from "../../../../adapters_interface/repositories/v2";
import { Category } from "../../../../domain/entities/v2/Category";
import { CategoryMapper } from "../../mappers/v2/CategoryMapper";
import prisma from "../../prisma.client";
import { PrismaTransaction } from "../../PrismaTransaction";
import { InvalidEntityError } from "../../../../app/errors/v2/InvalidEntityError";

export class PrismaCategoryRepository implements CategoryRepository {

  async findManyByIds(
    ids: string[],
    tx: PrismaTransaction = prisma
  ): Promise<Category[]> {
    const categories = await tx.category.findMany({
      where: { id: { in: ids } },
    });
    return categories.map(CategoryMapper.toDomain);
  }

  /**
   * Asserts that a pace range is contiguous within a category
   * using orderIndex (curriculum order).
   *
   * Throws InvalidEntityError if:
   * - start or end pace does not exist in the category
   * - start comes after end
   * - there are gaps in orderIndex between them
   */
  async assertContiguousPaceRange(
    categoryId: string,
    startPace: number,
    endPace: number,
    tx: PrismaTransaction = prisma
  ): Promise<void> {

    if (startPace === endPace) {
      return; // single pace is always valid
    }

    // Fetch orderIndex for start & end
    const boundaries = await tx.paceCatalog.findMany({
      where: {
        code: { in: [String(startPace), String(endPace)] },
        subSubject: { categoryId },
      },
      select: {
        code: true,
        orderIndex: true,
      },
    });

    if (boundaries.length !== 2) {
      throw new InvalidEntityError(
        'PaceCatalog',
        'Start or end pace does not belong to this category'
      );
    }

    const start = boundaries.find(b => b.code === String(startPace))!;
    const end = boundaries.find(b => b.code === String(endPace))!;

    if (start.orderIndex > end.orderIndex) {
      throw new InvalidEntityError(
        'PaceCatalog',
        'Start pace comes after end pace in curriculum order'
      );
    }

    // Count all paces between them by orderIndex
    const count = await tx.paceCatalog.count({
      where: {
        subSubject: { categoryId },
        orderIndex: {
          gte: start.orderIndex,
          lte: end.orderIndex,
        },
      },
    });

    const expected = end.orderIndex - start.orderIndex + 1;

    if (count !== expected) {
      throw new InvalidEntityError(
        'PaceCatalog',
        'Pace range is not contiguous within the category'
      );
    }
  }
}
