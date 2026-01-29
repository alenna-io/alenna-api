import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetSubjectAndNextLevelsWithPacesUseCase } from '../../../../core/application/use-cases/subjects/GetSubjectAndNextLevelsWithPacesUseCase';
import { InvalidEntityError, ObjectNotFoundError } from '../../../../core/domain/errors';
import { createMockSubjectRepository } from '../../utils/mockRepositories';

describe('GetSubjectAndNextLevelsWithPacesUseCase', () => {
  let subjectRepo: ReturnType<typeof createMockSubjectRepository>;
  let useCase: GetSubjectAndNextLevelsWithPacesUseCase;

  beforeEach(() => {
    subjectRepo = createMockSubjectRepository();
    useCase = new GetSubjectAndNextLevelsWithPacesUseCase(subjectRepo);
  });

  it('returns subjects with paces for current and next 2 levels', async () => {
    const subjectId = 'clh1234567890abcdefghijkl';
    const subjects = [
      {
        id: 'clh1234567890abcdefghijkl',
        name: 'Math L2',
        level: {
          id: 'L2',
          number: 2,
          name: 'Level 2',
        },
        paces: [
          {
            id: 'clh1111111111111111111111',
            code: '1013',
            name: 'Math 1013',
            orderIndex: 13,
          },
          {
            id: 'clh2222222222222222222222',
            code: '1014',
            name: 'Math 1014',
            orderIndex: 14,
          },
        ],
      },
      {
        id: 'clh3333333333333333333333',
        name: 'Math L3',
        level: {
          id: 'L3',
          number: 3,
          name: 'Level 3',
        },
        paces: [
          {
            id: 'clh4444444444444444444444',
            code: '1025',
            name: 'Math 1025',
            orderIndex: 25,
          },
        ],
      },
      {
        id: 'clh5555555555555555555555',
        name: 'Math L4',
        level: {
          id: 'L4',
          number: 4,
          name: 'Level 4',
        },
        paces: [
          {
            id: 'clh6666666666666666666666',
            code: '1037',
            name: 'Math 1037',
            orderIndex: 37,
          },
        ],
      },
    ] as any;

    vi.mocked(subjectRepo.findBySubjectAndNextLevelsWithPaces).mockResolvedValue(subjects as any);

    const result = await useCase.execute(subjectId);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(subjects);
      expect(result.data).toHaveLength(3);
      expect(result.data[0].level.number).toBe(2);
      expect(result.data[1].level.number).toBe(3);
      expect(result.data[2].level.number).toBe(4);
      expect(result.data[0].paces).toHaveLength(2);
    }
    expect(subjectRepo.findBySubjectAndNextLevelsWithPaces).toHaveBeenCalledWith(subjectId, 2);
  });

  it('returns empty array when subject not found', async () => {
    const subjectId = 'clh1234567890abcdefghijkl';

    vi.mocked(subjectRepo.findBySubjectAndNextLevelsWithPaces).mockResolvedValue([]);

    const result = await useCase.execute(subjectId);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
      expect(result.data).toHaveLength(0);
    }
  });

  it('returns Err when repository throws InvalidEntityError', async () => {
    const subjectId = 'clh1234567890abcdefghijkl';
    const error = new InvalidEntityError('Subject', 'Subject not found');
    vi.mocked(subjectRepo.findBySubjectAndNextLevelsWithPaces).mockRejectedValue(error);

    const result = await useCase.execute(subjectId);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(InvalidEntityError);
      expect(result.error.message).toBe('Subject not found');
    }
  });

  it('returns Err when repository throws ObjectNotFoundError', async () => {
    const subjectId = 'clh1234567890abcdefghijkl';
    const error = new ObjectNotFoundError('Subject');
    vi.mocked(subjectRepo.findBySubjectAndNextLevelsWithPaces).mockRejectedValue(error);

    const result = await useCase.execute(subjectId);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ObjectNotFoundError);
    }
  });

  it('re-throws unexpected errors', async () => {
    const subjectId = 'clh1234567890abcdefghijkl';
    const unexpectedError = new Error('Database connection failed');
    vi.mocked(subjectRepo.findBySubjectAndNextLevelsWithPaces).mockRejectedValue(unexpectedError);

    await expect(useCase.execute(subjectId)).rejects.toThrow('Database connection failed');
  });
});
