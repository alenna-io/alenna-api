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
import {
  CreateProjectionUseCase,
  GenerateProjectionUseCase,
  GetProjectionListUseCase,
  GetProjectionDetailsUseCase,
  MovePaceUseCase,
  AddPaceUseCase,
  DeletePaceUseCase
} from '../../../application/use-cases/projections';
// Category Use Cases
import { GetCategoriesWithSubjectsUseCase } from '../../../application/use-cases/categories';
// School Use Cases
import { GetSchoolWithCurrentYearByUserIdUseCase } from '../../../application/use-cases/schools';
// Student Use Cases
import { GetEnrolledWithoutOpenProjectionUseCase } from '../../../application/use-cases/students';
// Subject Use Cases
import { GetSubjectAndNextLevelsWithPacesUseCase } from '../../../application/use-cases/subjects';

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

const getProjectionListUseCase = new GetProjectionListUseCase(
  projectionRepository
);

const getProjectionDetailsUseCase = new GetProjectionDetailsUseCase(
  projectionRepository,
  schoolYearRepository
);

const movePaceUseCase = new MovePaceUseCase(
  projectionRepository
);

const addPaceUseCase = new AddPaceUseCase(
  projectionRepository,
  paceCatalogRepository
);

const deletePaceUseCase = new DeletePaceUseCase(
  projectionRepository
);

// Category Use Cases
const getCategoriesWithSubjectsUseCase = new GetCategoriesWithSubjectsUseCase(
  categoryRepository
);

// School Use Cases
const getSchoolWithCurrentYearByUserIdUseCase = new GetSchoolWithCurrentYearByUserIdUseCase(
  schoolRepository
);

// Student Use Cases
const getEnrolledWithoutOpenProjectionUseCase = new GetEnrolledWithoutOpenProjectionUseCase(
  studentRepository,
  schoolRepository
);

// Subject Use Cases
const getSubjectAndNextLevelsWithPacesUseCase = new GetSubjectAndNextLevelsWithPacesUseCase(
  subjectRepository
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
    // Projection Use Cases
    createProjectionUseCase,
    generateProjectionUseCase,
    getProjectionListUseCase,
    getProjectionDetailsUseCase,
    movePaceUseCase,
    addPaceUseCase,
    deletePaceUseCase,
    // Category Use Cases
    getCategoriesWithSubjectsUseCase,
    // School Use Cases
    getSchoolWithCurrentYearByUserIdUseCase,
    // Student Use Cases
    getEnrolledWithoutOpenProjectionUseCase,
    // Subject Use Cases
    getSubjectAndNextLevelsWithPacesUseCase,
  },
};
