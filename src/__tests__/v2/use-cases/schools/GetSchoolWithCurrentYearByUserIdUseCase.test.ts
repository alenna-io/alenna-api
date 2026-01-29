import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetSchoolWithCurrentYearByUserIdUseCase } from '../../../../core/application/use-cases/schools/GetSchoolWithCurrentYearByUserIdUseCase';
import { InvalidEntityError, ObjectNotFoundError } from '../../../../core/domain/errors';
import { createMockSchoolRepository } from '../../utils/mockRepositories';
import { Prisma, SchoolStatus, SchoolYearStatus } from '@prisma/client';

describe('GetSchoolWithCurrentYearByUserIdUseCase', () => {
  let schoolRepo: ReturnType<typeof createMockSchoolRepository>;
  let useCase: GetSchoolWithCurrentYearByUserIdUseCase;

  beforeEach(() => {
    schoolRepo = createMockSchoolRepository();
    useCase = new GetSchoolWithCurrentYearByUserIdUseCase(schoolRepo);
  });

  it('returns school with current year successfully', async () => {
    const userId = 'clh1234567890abcdefghijkl';
    const school: Prisma.SchoolGetPayload<{ include: { schoolYears: true } }> = {
      id: 'clh1111111111111111111111',
      name: 'Test School',
      address: null,
      phone: null,
      email: null,
      logoUrl: null,
      teacherLimit: null,
      userLimit: null,
      status: SchoolStatus.ACTIVE,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      schoolYears: [
        {
          id: 'clh2222222222222222222222',
          schoolId: 'clh1111111111111111111111',
          name: '2025-2026',
          startDate: new Date('2025-09-01'),
          endDate: new Date('2026-07-11'),
          status: SchoolYearStatus.CURRENT_YEAR,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    vi.mocked(schoolRepo.findSchoolWithCurrentYearByUserId).mockResolvedValue(school as any);

    const result = await useCase.execute(userId);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(school);
      const dataWithSchoolYears = result.data as Prisma.SchoolGetPayload<{ include: { schoolYears: true } }>;
      expect(dataWithSchoolYears?.schoolYears).toHaveLength(1);
      expect(dataWithSchoolYears?.schoolYears?.[0]?.status).toBe(SchoolYearStatus.CURRENT_YEAR);
    }
    expect(schoolRepo.findSchoolWithCurrentYearByUserId).toHaveBeenCalledWith(userId);
  });

  it('returns null when school not found', async () => {
    const userId = 'clh1234567890abcdefghijkl';

    vi.mocked(schoolRepo.findSchoolWithCurrentYearByUserId).mockResolvedValue(null);

    const result = await useCase.execute(userId);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });

  it('returns Err when repository throws InvalidEntityError', async () => {
    const userId = 'clh1234567890abcdefghijkl';
    const error = new InvalidEntityError('School', 'Failed to fetch school');
    vi.mocked(schoolRepo.findSchoolWithCurrentYearByUserId).mockRejectedValue(error);

    const result = await useCase.execute(userId);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(InvalidEntityError);
      expect(result.error.message).toBe('Failed to fetch school');
    }
  });

  it('returns Err when repository throws ObjectNotFoundError', async () => {
    const userId = 'clh1234567890abcdefghijkl';
    const error = new ObjectNotFoundError('School');
    vi.mocked(schoolRepo.findSchoolWithCurrentYearByUserId).mockRejectedValue(error);

    const result = await useCase.execute(userId);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ObjectNotFoundError);
    }
  });

  it('re-throws unexpected errors', async () => {
    const userId = 'clh1234567890abcdefghijkl';
    const unexpectedError = new Error('Database connection failed');
    vi.mocked(schoolRepo.findSchoolWithCurrentYearByUserId).mockRejectedValue(unexpectedError);

    await expect(useCase.execute(userId)).rejects.toThrow('Database connection failed');
  });
});
