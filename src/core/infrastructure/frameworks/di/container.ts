import {
  PrismaProjectionRepository,
  PrismaSchoolRepository,
  PrismaSchoolYearRepository,
  PrismaStudentRepository,
  PrismaPaceCatalogRepository,
  PrismaProjectionPaceRepository,
  PrismaSubjectRepository,
  PrismaCategoryRepository,
} from '../../repositories';
// Domain Services
import { AlennaProjectionAlgorithm } from '../../../domain/algorithms/alenna-projection.algorithm';
// Projection Use Cases
import { CreateProjectionUseCase } from '../../../application/use-cases/projections/CreateProjectionUseCase';
import { GenerateProjectionUseCase } from '../../../application/use-cases/projections/GenerateProjectionUseCase';

// Repositories
const projectionRepository = new PrismaProjectionRepository();
const studentRepository = new PrismaStudentRepository();
const schoolRepository = new PrismaSchoolRepository();
const schoolYearRepository = new PrismaSchoolYearRepository();
const paceCatalogRepository = new PrismaPaceCatalogRepository();
const projectionPaceRepository = new PrismaProjectionPaceRepository();
const subjectRepository = new PrismaSubjectRepository();
const categoryRepository = new PrismaCategoryRepository();

// Domain Services
const alennaProjectionGenerator = new AlennaProjectionAlgorithm();

// Projection Use Cases
const createProjectionUseCase = new CreateProjectionUseCase(
  projectionRepository,
  studentRepository,
  schoolRepository,
  schoolYearRepository
);

const generateProjectionUseCase = new GenerateProjectionUseCase(
  projectionRepository,
  studentRepository,
  schoolRepository,
  schoolYearRepository,
  projectionPaceRepository,
  paceCatalogRepository,
  subjectRepository,
  categoryRepository,
  alennaProjectionGenerator
);

// Container
export const container = {
  repository: {
    projectionRepository,
    studentRepository,
    schoolRepository,
    schoolYearRepository,
    paceCatalogRepository,
    projectionPaceRepository,
    subjectRepository,
    categoryRepository,
  },
  service: {
    projectionGenerator: alennaProjectionGenerator,
  },
  useCase: {
    createProjectionUseCase,
    generateProjectionUseCase,
  },
};
