import { PrismaProjectionRepository, PrismaSchoolRepository, PrismaSchoolYearRepository, PrismaStudentRepository } from '../../database/repositories/v2';
import { CreateProjectionUseCase } from '../../../app/use-cases/projections/v2/CreateProjectionUseCase';

// Repositories
const projectionRepository = new PrismaProjectionRepository();
const studentRepository = new PrismaStudentRepository();
const schoolRepository = new PrismaSchoolRepository();
const schoolYearRepository = new PrismaSchoolYearRepository();

// Use Cases
const createProjectionUseCase = new CreateProjectionUseCase(
  projectionRepository,
  studentRepository,
  schoolRepository,
  schoolYearRepository
);

// Container
export const container = {
  repository: {
    projectionRepository,
    studentRepository,
    schoolRepository,
    schoolYearRepository,
  },
  useCase: {
    createProjectionUseCase,
  },
};
