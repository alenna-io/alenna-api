import { vi } from 'vitest';
import { IStudentRepository } from '../../core/adapters_interface/repositories';
import { Student } from '../../core/domain/entities';

/**
 * Creates a mock StudentRepository with all methods mocked
 * Use vi.mocked() to set return values for specific methods in tests
 */
export function createMockStudentRepository(): IStudentRepository {
  return {
    findById: vi.fn(),
    findBySchoolId: vi.fn(),
    create: vi.fn(),
    createWithUser: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

/**
 * Helper to create a mock repository with default return values
 * Useful for tests that don't need to verify specific repository calls
 */
export function createMockStudentRepositoryWithDefaults(
  defaults: Partial<Record<keyof IStudentRepository, any>>
): IStudentRepository {
  const mock = createMockStudentRepository();
  
  // Apply defaults
  if (defaults.findById !== undefined) {
    vi.mocked(mock.findById).mockResolvedValue(defaults.findById);
  }
  if (defaults.findBySchoolId !== undefined) {
    vi.mocked(mock.findBySchoolId).mockResolvedValue(defaults.findBySchoolId);
  }
  if (defaults.create !== undefined) {
    vi.mocked(mock.create).mockResolvedValue(defaults.create);
  }
  if (defaults.createWithUser !== undefined) {
    vi.mocked(mock.createWithUser).mockResolvedValue(defaults.createWithUser);
  }
  if (defaults.update !== undefined) {
    vi.mocked(mock.update).mockResolvedValue(defaults.update);
  }
  if (defaults.delete !== undefined) {
    vi.mocked(mock.delete).mockResolvedValue(defaults.delete);
  }
  
  return mock;
}

