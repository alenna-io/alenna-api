import { vi } from 'vitest';
import { ProjectionGenerator } from '../../../core/domain/services/ProjectionGenerator';

export function createMockProjectionGenerator(): ProjectionGenerator {
  return {
    generate: vi.fn(),
  };
}