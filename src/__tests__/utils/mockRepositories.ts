import { vi } from 'vitest';
import { IStudentRepository, IUserRepository, ISchoolRepository, ISchoolYearRepository, IGroupRepository, IRoleRepository, IProjectionRepository, IDailyGoalRepository } from '../../core/adapters_interface/repositories';
import { IProjectionTemplateRepository } from '../../core/adapters_interface/repositories/IProjectionTemplateRepository';
import { Student, Projection } from '../../core/domain/entities';

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
 * Creates a mock UserRepository with all methods mocked
 * Use vi.mocked() to set return values for specific methods in tests
 */
export function createMockUserRepository(): IUserRepository {
  return {
    findById: vi.fn(),
    findByClerkId: vi.fn(),
    findByEmail: vi.fn(),
    findByEmailIncludingDeleted: vi.fn(),
    findBySchoolId: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
    reactivate: vi.fn(),
    delete: vi.fn(),
  };
}

/**
 * Creates a mock ProjectionTemplateRepository with all methods mocked
 * Use vi.mocked() to set return values for specific methods in tests
 */
export function createMockProjectionTemplateRepository(): IProjectionTemplateRepository {
  return {
    findById: vi.fn(),
    findBySchoolId: vi.fn(),
    findByLevel: vi.fn(),
    findDefaultByLevel: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

/**
 * Creates a mock SchoolRepository with all methods mocked
 * Use vi.mocked() to set return values for specific methods in tests
 */
export function createMockSchoolRepository(): ISchoolRepository {
  return {
    findById: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    activate: vi.fn(),
    deactivate: vi.fn(),
    delete: vi.fn(),
  };
}

/**
 * Creates a mock SchoolYearRepository with all methods mocked
 * Use vi.mocked() to set return values for specific methods in tests
 */
export function createMockSchoolYearRepository(): ISchoolYearRepository {
  return {
    findById: vi.fn(),
    findBySchoolId: vi.fn(),
    findActiveBySchoolId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    setActive: vi.fn(),
    getCurrentWeek: vi.fn(),
  };
}

/**
 * Creates a mock GroupRepository with all methods mocked
 * Use vi.mocked() to set return values for specific methods in tests
 */
export function createMockGroupRepository(): IGroupRepository {
  return {
    findBySchoolYearId: vi.fn(),
    findByTeacherIdAndSchoolYearId: vi.fn(),
    findById: vi.fn(),
    findByTeacherSchoolYearAndName: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getGroupStudents: vi.fn(),
    addStudentToGroup: vi.fn(),
    removeStudentFromGroup: vi.fn(),
    addStudentsToGroup: vi.fn(),
    exists: vi.fn(),
    isStudentInGroupForSchoolYear: vi.fn(),
    getStudentAssignmentsForSchoolYear: vi.fn(),
  };
}

/**
 * Creates a mock RoleRepository with all methods mocked
 * Use vi.mocked() to set return values for specific methods in tests
 */
export function createMockRoleRepository(): IRoleRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByName: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

/**
 * Creates a mock ProjectionRepository with all methods mocked
 * Use vi.mocked() to set return values for specific methods in tests
 */
export function createMockProjectionRepository(): IProjectionRepository {
  return {
    findById: vi.fn(),
    findByIdWithPaces: vi.fn(),
    findByStudentId: vi.fn(),
    findActiveByStudentId: vi.fn(),
    findByStudentIdAndSchoolYear: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    hardDelete: vi.fn(),
  };
}

/**
 * Creates a mock DailyGoalRepository with all methods mocked
 * Use vi.mocked() to set return values for specific methods in tests
 */
export function createMockDailyGoalRepository(): IDailyGoalRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByProjectionQuarterWeek: vi.fn(),
    findByProjection: vi.fn(),
    update: vi.fn(),
    updateCompletionStatus: vi.fn(),
    updateNotes: vi.fn(),
    delete: vi.fn(),
    softDelete: vi.fn(),
    addNoteToHistory: vi.fn(),
    getNoteHistoryByDailyGoalId: vi.fn(),
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

