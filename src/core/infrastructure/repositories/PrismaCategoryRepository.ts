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

    let start: { code: string; orderIndex: number; subjectId: string } | null = null;
    let end: { code: string; orderIndex: number; subjectId: string } | null = null;

    if (isElectives) {
      // For Electives: both paces must be in the specified subject (if provided) or same subject
      const subjectWhereClause: any = {
        categoryId,
      };

      if (subjectId) {
        subjectWhereClause.id = subjectId;
      }

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

      start = boundaries.find(b => this.normalizePaceCode(b.code) === normalizedStartPace)!;
      end = boundaries.find(b => this.normalizePaceCode(b.code) === normalizedEndPace)!;
    } else {
      // For non-Electives: allow spanning multiple subjects within the category
      // Find start pace in the specified subject (if provided) or anywhere in category
      // Find end pace anywhere in the category

      if (subjectId) {
        // First, find start pace in the specified subject
        const startSubjectPaces = await tx.paceCatalog.findMany({
          where: {
            subject: {
              id: subjectId,
              categoryId,
            },
          },
          select: {
            code: true,
            orderIndex: true,
            subjectId: true,
          },
        });

        const startBoundary = startSubjectPaces.find(p => this.normalizePaceCode(p.code) === normalizedStartPace);
        if (!startBoundary) {
          throw new InvalidEntityError(
            'PaceCatalog',
            `Start pace ${startPace} does not belong to subject ${subjectId} in category ${categoryId}`
          );
        }
        start = startBoundary;

        // Then, find end pace anywhere in the category
        const allCategoryPaces = await tx.paceCatalog.findMany({
          where: {
            subject: { categoryId },
          },
          select: {
            code: true,
            orderIndex: true,
            subjectId: true,
          },
        });

        const endBoundary = allCategoryPaces.find(p => this.normalizePaceCode(p.code) === normalizedEndPace);
        if (!endBoundary) {
          throw new InvalidEntityError(
            'PaceCatalog',
            `End pace ${endPace} does not belong to category ${categoryId}`
          );
        }
        end = endBoundary;
      } else {
        // No subjectId provided: find both paces anywhere in the category
        const allCategoryPaces = await tx.paceCatalog.findMany({
          where: {
            subject: { categoryId },
          },
          select: {
            code: true,
            orderIndex: true,
            subjectId: true,
          },
        });

        const boundaries = allCategoryPaces.filter(pace => {
          const normalizedCode = this.normalizePaceCode(pace.code);
          return normalizedCode === normalizedStartPace || normalizedCode === normalizedEndPace;
        });

        if (boundaries.length !== 2) {
          const foundCodes = boundaries.map(b => b.code).join(', ');
          throw new InvalidEntityError(
            'PaceCatalog',
            `Start or end pace does not belong to this category. Found: ${foundCodes || 'none'}. Looking for: ${startPace}, ${endPace}`
          );
        }

        start = boundaries.find(b => this.normalizePaceCode(b.code) === normalizedStartPace)!;
        end = boundaries.find(b => this.normalizePaceCode(b.code) === normalizedEndPace)!;
      }
    }

    if (start.orderIndex > end.orderIndex) {
      throw new InvalidEntityError(
        'PaceCatalog',
        'Start pace comes after end pace in curriculum order'
      );
    }

    // For Electives: must be within the same subject
    if (isElectives) {
      // If subjectId was provided, ensure both paces belong to that subject
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
      return; // Electives can have any pace numbers, just need to exist in the subject
    }

    // For non-Electives: allow spanning multiple subjects within the same category
    // as long as the pace range is contiguous across the category (using orderIndex)
    // Both paces must belong to the category (already validated above)

    // If subjectId was provided, validate that start pace belongs to that subject
    // (but allow end pace to be in a different subject within the same category)
    if (subjectId) {
      if (start.subjectId !== subjectId) {
        throw new InvalidEntityError(
          'PaceCatalog',
          `Start pace does not belong to the specified subject. Start pace (${startPace}) belongs to subject ${start.subjectId}, but ${subjectId} was specified`
        );
      }
      // End pace can be in a different subject within the same category
    }

    // Validate strict contiguous range across the category (allowing multiple subjects)
    // Count all paces between them by orderIndex within the category (not restricted to a single subject)
    const countWhereClause: any = {
      subject: { categoryId },
      orderIndex: {
        gte: start.orderIndex,
        lte: end.orderIndex,
      },
    };

    const count = await tx.paceCatalog.count({
      where: countWhereClause,
    });

    const expected = end.orderIndex - start.orderIndex + 1;

    if (count !== expected) {
      throw new InvalidEntityError(
        'PaceCatalog',
        `Pace range is not contiguous within the category. Expected ${expected} paces, found ${count}`
      );
    }
  }
}
