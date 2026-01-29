import { vi } from 'vitest';
import { ProjectionGenerator } from '../../../core/domain/algorithms/projection-generator';

export function createMockProjectionGenerator(): ProjectionGenerator {
  return {
    generate: vi.fn(),
  };
}