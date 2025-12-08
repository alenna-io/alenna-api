import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateUserUseCase } from '../../../core/app/use-cases/users/UpdateUserUseCase';
import { createMockUserRepository } from '../../utils/mockRepositories';
import { createTestUser, TEST_CONSTANTS } from '../../utils/testHelpers';

describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase;
  let mockRepository: ReturnType<typeof createMockUserRepository>;

  beforeEach(() => {
    mockRepository = createMockUserRepository();
    useCase = new UpdateUserUseCase(mockRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should update user successfully as school admin', async () => {
      const existingUser = createTestUser({ id: 'user-1' });
      const updatedUser = createTestUser({
        id: 'user-1',
        firstName: 'Updated',
        lastName: 'Name',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(existingUser);
      vi.mocked(mockRepository.update).mockResolvedValue(updatedUser);

      const result = await useCase.execute(
        'user-1',
        { firstName: 'Updated', lastName: 'Name' },
        'admin-user-id',
        ['SCHOOL_ADMIN']
      );

      expect(result).toEqual(updatedUser);
      expect(mockRepository.findById).toHaveBeenCalledWith('user-1');
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should update user successfully as super admin', async () => {
      const existingUser = createTestUser({ id: 'user-1' });
      const updatedUser = createTestUser({
        id: 'user-1',
        firstName: 'Updated',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(existingUser);
      vi.mocked(mockRepository.update).mockResolvedValue(updatedUser);

      const result = await useCase.execute(
        'user-1',
        { firstName: 'Updated' },
        'admin-user-id',
        ['SUPERADMIN']
      );

      expect(result).toEqual(updatedUser);
      expect(mockRepository.findById).toHaveBeenCalledWith('user-1');
    });

    it('should allow user to update themselves', async () => {
      const existingUser = createTestUser({ id: 'user-1' });
      const updatedUser = createTestUser({
        id: 'user-1',
        firstName: 'Updated',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(existingUser);
      vi.mocked(mockRepository.update).mockResolvedValue(updatedUser);

      const result = await useCase.execute(
        'user-1',
        { firstName: 'Updated' },
        'user-1',
        ['TEACHER']
      );

      expect(result).toEqual(updatedUser);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(
        useCase.execute('non-existent', {}, 'admin-user-id', ['SCHOOL_ADMIN'])
      ).rejects.toThrow('User not found');
    });

    it('should throw error when non-admin tries to update another user', async () => {
      const existingUser = createTestUser({ id: 'user-1' });

      vi.mocked(mockRepository.findById).mockResolvedValue(existingUser);

      await expect(
        useCase.execute('user-1', { firstName: 'Updated' }, 'other-user-id', ['TEACHER'])
      ).rejects.toThrow('Forbidden: Cannot update other users');
    });

    it('should throw error when non-admin tries to change roles', async () => {
      const existingUser = createTestUser({ id: 'user-1' });

      vi.mocked(mockRepository.findById).mockResolvedValue(existingUser);

      await expect(
        useCase.execute('user-1', { roleIds: ['role-1'] }, 'user-1', ['TEACHER'])
      ).rejects.toThrow('Forbidden: Cannot change your own roles');
    });

    it('should allow admin to update roles', async () => {
      const existingUser = createTestUser({ id: 'user-1' });
      const updatedUser = createTestUser({ id: 'user-1' });

      vi.mocked(mockRepository.findById).mockResolvedValue(existingUser);
      vi.mocked(mockRepository.update).mockResolvedValue(updatedUser);

      const result = await useCase.execute(
        'user-1',
        { roleIds: ['role-1'] },
        'admin-user-id',
        ['SCHOOL_ADMIN']
      );

      expect(result).toEqual(updatedUser);
      expect(mockRepository.update).toHaveBeenCalled();
    });
  });
});

