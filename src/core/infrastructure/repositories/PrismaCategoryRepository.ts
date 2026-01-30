import prisma from "../database/prisma.client";
import { PrismaTransaction } from "../database/PrismaTransaction";
import { InvalidEntityError } from "../../domain/errors";
import { Prisma } from '@prisma/client';
import { ICategoryRepository } from '../../domain/interfaces/repositories';

export class PrismaCategoryRepository implements ICategoryRepository {

  async findManyByIds(
    ids: string[],
    tx: PrismaTransaction = prisma
  ): Promise<Prisma.CategoryGetPayload<{}>[]> {
    return await tx.category.findMany({
      where: { id: { in: ids } },
    });
  }

  async findAllWithSubjects(tx: PrismaTransaction = prisma): Promise<Prisma.CategoryGetPayload<{ include: { subjects: true } }>[]> {
    return await tx.category.findMany({
      include: {
        subjects: true,
      },
    });
  }

  /**
   * Normalizes pace code by removing leading zeros for comparison
   * e.g., "001" -> "1", "012" -> "12"
   */
  private normalizePaceCode(code: string | number): string {
    return String(parseInt(String(code), 10));
  }

  /**
   * Asserts that a pace range is contiguous within a category
   * using orderIndex (curriculum order).
   *
   * For Electives category: Only validates that paces exist in the subject (if provided)
   * and that start comes before end. Does not enforce strict contiguous orderIndex validation.
   *
   * For other categories: Validates strict contiguous range within the subject.
   *
   * Throws InvalidEntityError if:
   * - start or end pace does not exist in the category (or subject if provided)
   * - start comes after end
   * - there are gaps in orderIndex between them (non-Electives only)
   */
  async assertContiguousPaceRange(
    categoryId: string,
    startPace: number,
    endPace: number,
    subjectId?: string | null,
    tx: PrismaTransaction = prisma
  ): Promise<void> {

    if (startPace === endPace) {
      return; // single pace is always valid
    }

    // Check if this is the Electives category
    const category = await tx.category.findUnique({
      where: { id: categoryId },
      select: { name: true },
    });

    const isElectives = category?.name === 'Electives';

    // Normalize pace codes for comparison (remove leading zeros)
    const normalizedStartPace = this.normalizePaceCode(startPace);
    const normalizedEndPace = this.normalizePaceCode(endPace);

    // Build where clause - need to check both normalized and original formats
    // Since codes might be stored as "001" but searched as "1", we need to fetch all
    // paces in the subject and then filter by normalized code
    const subjectWhereClause: any = {
      categoryId,
    };

    if (subjectId) {
      subjectWhereClause.id = subjectId;
    }

    // Fetch all paces in the subject/category to find matches by normalized code
    const allPaces = await tx.paceCatalog.findMany({
      where: {
        subject: subjectWhereClause,
      },
      select: {
        code: true,
        orderIndex: true,
        subjectId: true,
      },
    });

    // Find boundaries by comparing normalized codes
    const boundaries = allPaces.filter(pace => {
      const normalizedCode = this.normalizePaceCode(pace.code);
      return normalizedCode === normalizedStartPace || normalizedCode === normalizedEndPace;
    });

    if (boundaries.length !== 2) {
      const foundCodes = boundaries.map(b => b.code).join(', ');
      const errorMessage = subjectId
        ? `Start or end pace does not belong to this subject. Found: ${foundCodes || 'none'}. Looking for: ${startPace}, ${endPace}`
        : `Start or end pace does not belong to this category. Found: ${foundCodes || 'none'}. Looking for: ${startPace}, ${endPace}`;
      throw new InvalidEntityError(
        'PaceCatalog',
        errorMessage
      );
    }

    // Find start and end boundaries by normalized code comparison
    const start = boundaries.find(b => this.normalizePaceCode(b.code) === normalizedStartPace)!;
    const end = boundaries.find(b => this.normalizePaceCode(b.code) === normalizedEndPace)!;

    // If subjectId was provided, ensure both paces belong to the same subject
    if (subjectId) {
      if (start.subjectId !== end.subjectId || start.subjectId !== subjectId) {
        throw new InvalidEntityError(
          'PaceCatalog',
          `Start and end paces must belong to the same subject. Start pace belongs to subject ${start.subjectId}, end pace belongs to subject ${end.subjectId}`
        );
      }
    } else {
      // If no subjectId provided, ensure both paces belong to the same subject
      if (start.subjectId !== end.subjectId) {
        throw new InvalidEntityError(
          'PaceCatalog',
          `Start and end paces must belong to the same subject. Start pace (${startPace}) belongs to subject ${start.subjectId}, end pace (${endPace}) belongs to subject ${end.subjectId}`
        );
      }
    }

    if (start.orderIndex > end.orderIndex) {
      throw new InvalidEntityError(
        'PaceCatalog',
        'Start pace comes after end pace in curriculum order'
      );
    }

    // For Electives, skip strict contiguous validation - just ensure both paces exist in the subject
    if (isElectives) {
      return; // Electives can have any pace numbers, just need to exist in the subject
    }

    // For non-Electives, validate strict contiguous range
    // Count all paces between them by orderIndex within the same subject
    const countWhereClause: any = {
      subject: { categoryId },
      orderIndex: {
        gte: start.orderIndex,
        lte: end.orderIndex,
      },
    };

    // If subjectId was provided or we determined it, use it
    const targetSubjectId = subjectId || boundaries[0].subjectId;
    if (targetSubjectId) {
      countWhereClause.subject.id = targetSubjectId;
    }

    const count = await tx.paceCatalog.count({
      where: countWhereClause,
    });

    const expected = end.orderIndex - start.orderIndex + 1;

    if (count !== expected) {
      throw new InvalidEntityError(
        'PaceCatalog',
        `Pace range is not contiguous within the ${subjectId ? 'subject' : 'category'}. Expected ${expected} paces, found ${count}`
      );
    }
  }
}
