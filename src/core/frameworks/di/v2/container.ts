import {
  PrismaProjectionRepository,
  PrismaSchoolRepository,
  PrismaSchoolYearRepository,
  PrismaStudentRepository,
  PrismaPaceCatalogRepository,
  PrismaProjectionPaceRepository,
  PrismaSubSubjectRepository,
} from '../../database/repositories/v2';
// Domain Services
import { AlennaProjectionAlgorithm } from '../../../domain/services/implementations/AlennaProjectionAlgorithm';
import { ProjectionPaceFactory } from '../../../domain/factories/ProjectionPaceFactory';
// Projection Use Cases
import { CreateProjectionUseCase } from '../../../app/use-cases/projections/v2/CreateProjectionUseCase';
import { GenerateProjectionUseCase } from '../../../app/use-cases/projections/v2/GenerateProjectionUseCase';

// Repositories
const projectionRepository = new PrismaProjectionRepository();
const studentRepository = new PrismaStudentRepository();
const schoolRepository = new PrismaSchoolRepository();
const schoolYearRepository = new PrismaSchoolYearRepository();
const paceCatalogRepository = new PrismaPaceCatalogRepository();
const projectionPaceRepository = new PrismaProjectionPaceRepository();
const subSubjectRepository = new PrismaSubSubjectRepository();

// Domain Services
const alennaProjectionGenerator = new AlennaProjectionAlgorithm();
const projectionPaceFactory = new ProjectionPaceFactory();

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
  subSubjectRepository,
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
    subSubjectRepository,
  },
  service: {
    projectionGenerator: alennaProjectionGenerator,
    projectionPaceFactory,
  },
  useCase: {
    createProjectionUseCase,
    generateProjectionUseCase,
  },
};
