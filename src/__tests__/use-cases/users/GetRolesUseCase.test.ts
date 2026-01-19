import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetRolesUseCase } from '../../../core/app/use-cases/deprecated/users/GetRolesUseCase';
import { createMockRoleRepository } from '../../utils/mockRepositories';
import { Role } from '../../../core/domain/entities/deprecated';

describe('GetRolesUseCase', () => {
  let useCase: GetRolesUseCase;
  let mockRepository: ReturnType<typeof createMockRoleRepository>;

  beforeEach(() => {
    mockRepository = createMockRoleRepository();
    useCase = new GetRolesUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return all roles', async () => {
      const roles = [
        new Role('role-1', 'TEACHER', 'Teacher', 'Teacher role', true, true, undefined),
        new Role('role-2', 'SCHOOL_ADMIN', 'School Admin', 'School admin role', true, true, undefined),
      ];

      vi.mocked(mockRepository.findAll).mockResolvedValue(roles);

      const result = await useCase.execute();

      expect(result).toEqual(roles);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no roles exist', async () => {
      vi.mocked(mockRepository.findAll).mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result).toEqual([]);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });

    it('should return multiple roles', async () => {
      const roles = [
        new Role('role-1', 'TEACHER', 'Teacher', 'Teacher role', true, true, undefined),
        new Role('role-2', 'SCHOOL_ADMIN', 'School Admin', 'School admin role', true, true, undefined),
        new Role('role-3', 'PARENT', 'Parent', 'Parent role', true, true, undefined),
      ];

      vi.mocked(mockRepository.findAll).mockResolvedValue(roles);

      const result = await useCase.execute();

      expect(result).toEqual(roles);
      expect(result.length).toBe(3);
    });
  });
});

