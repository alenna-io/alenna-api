import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetCategoriesWithSubjectsUseCase } from '../../../../core/application/use-cases/categories/GetCategoriesWithSubjectsUseCase';
import { InvalidEntityError, ObjectNotFoundError } from '../../../../core/domain/errors';
import { createMockCategoryRepository } from '../../utils/mockRepositories';
import { Prisma } from '@prisma/client';

describe('GetCategoriesWithSubjectsUseCase', () => {
  let categoryRepo: ReturnType<typeof createMockCategoryRepository>;
  let useCase: GetCategoriesWithSubjectsUseCase;

  beforeEach(() => {
    categoryRepo = createMockCategoryRepository();
    useCase = new GetCategoriesWithSubjectsUseCase(categoryRepo);
  });

  it('returns categories with subjects successfully', async () => {
    const categories: Prisma.CategoryGetPayload<{ include: { subjects: true } }>[] = [
      {
        id: 'cat-1',
        name: 'Math',
        description: 'Mathematics category',
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        subjects: [
          {
            id: 'sub-1',
            name: 'Algebra',
            difficulty: 3,
            categoryId: 'cat-1',
            levelId: 'lvl-1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
      {
        id: 'cat-2',
        name: 'Science',
        description: 'Science category',
        displayOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        subjects: [
          {
            id: 'sub-2',
            name: 'Biology',
            difficulty: 4,
            categoryId: 'cat-2',
            levelId: 'lvl-1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    ];

    vi.mocked(categoryRepo.findAllWithSubjects).mockResolvedValue(categories as any);

    const result = await useCase.execute();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(categories);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].subjects).toHaveLength(1);
      expect(result.data[1].subjects).toHaveLength(1);
    }
    expect(categoryRepo.findAllWithSubjects).toHaveBeenCalledOnce();
  });

  it('returns empty array when no categories exist', async () => {
    vi.mocked(categoryRepo.findAllWithSubjects).mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
      expect(result.data).toHaveLength(0);
    }
  });

  it('returns Err when repository throws InvalidEntityError', async () => {
    const error = new InvalidEntityError('Category', 'Failed to fetch categories');
    vi.mocked(categoryRepo.findAllWithSubjects).mockRejectedValue(error);

    const result = await useCase.execute();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(InvalidEntityError);
      expect(result.error.message).toBe('Failed to fetch categories');
    }
  });

  it('returns Err when repository throws ObjectNotFoundError', async () => {
    const error = new ObjectNotFoundError('Category');
    vi.mocked(categoryRepo.findAllWithSubjects).mockRejectedValue(error);

    const result = await useCase.execute();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ObjectNotFoundError);
    }
  });

  it('re-throws unexpected errors', async () => {
    const unexpectedError = new Error('Database connection failed');
    vi.mocked(categoryRepo.findAllWithSubjects).mockRejectedValue(unexpectedError);

    await expect(useCase.execute()).rejects.toThrow('Database connection failed');
  });
});