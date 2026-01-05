import { PrismaProjectionRepository } from '../../database/repositories/v2/PrismaProjectionRepository';
import { CreateProjectionUseCase } from '../../../app/use-cases/projections/v2/CreateProjectionUseCase';

// Repositories
const projectionRepository = new PrismaProjectionRepository();

// Use Cases
const createProjectionUseCase = new CreateProjectionUseCase(
  projectionRepository
);

// Container
export const container = {
  repository: {
    projectionRepository,
  },
  useCase: {
    createProjectionUseCase,
  },
};
