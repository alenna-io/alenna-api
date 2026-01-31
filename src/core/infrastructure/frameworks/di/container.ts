import {
  PrismaProjectionRepository,
  PrismaSchoolRepository,
  PrismaSchoolYearRepository,
  PrismaStudentRepository,
  PrismaPaceCatalogRepository,
  PrismaProjectionPaceRepository,
  PrismaSubjectRepository,
  PrismaCategoryRepository,
  PrismaDailyGoalRepository,
  PrismaMonthlyAssignmentRepository,
  PrismaUserRepository,
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
  DeletePaceUseCase,
  UpdateGradeUseCase,
  MarkUngradedUseCase
} from '../../../application/use-cases/projections';
// Daily Goals Use Cases
import {
  GetDailyGoalsUseCase,
  CreateDailyGoalUseCase,
  AddNoteToDailyGoalUseCase,
  MarkDailyGoalCompleteUseCase,
} from '../../../application/use-cases/daily-goals';
// Category Use Cases
import { GetCategoriesWithSubjectsUseCase } from '../../../application/use-cases/categories';
// School Use Cases
import { GetSchoolWithCurrentYearByUserIdUseCase, GetCurrentWeekUseCase } from '../../../application/use-cases/schools';
// Student Use Cases
import { GetEnrolledWithoutOpenProjectionUseCase } from '../../../application/use-cases/students';
// Subject Use Cases
import { GetSubjectAndNextLevelsWithPacesUseCase } from '../../../application/use-cases/subjects';
// Auth Use Cases
import { SetupPasswordUseCase, GetUserInfoUseCase } from '../../../application/use-cases/auth';
// Monthly Goals Use Cases
import {
  CreateMonthlyAssignmentTemplateUseCase,
  GetMonthlyAssignmentsUseCase,
  UpdateMonthlyAssignmentTemplateUseCase,
  DeleteMonthlyAssignmentTemplateUseCase,
  CreateQuarterPercentageUseCase,
  GetProjectionMonthlyAssignmentsUseCase,
  UpdateMonthlyAssignmentGradeUseCase,
  MarkMonthlyAssignmentUngradedUseCase,
} from '../../../application/use-cases/monthly-assignments';

// Repositories
const projectionRepository = new PrismaProjectionRepository();
const studentRepository = new PrismaStudentRepository();
const schoolRepository = new PrismaSchoolRepository();
const schoolYearRepository = new PrismaSchoolYearRepository();
const paceCatalogRepository = new PrismaPaceCatalogRepository();
const projectionPaceRepository = new PrismaProjectionPaceRepository();
const subjectRepository = new PrismaSubjectRepository();
const categoryRepository = new PrismaCategoryRepository();
const dailyGoalRepository = new PrismaDailyGoalRepository();
const monthlyAssignmentRepository = new PrismaMonthlyAssignmentRepository();
const userRepository = new PrismaUserRepository();

// Domain Services
const alennaProjectionGenerator = new AlennaProjectionAlgorithm();

// Projection Use Cases
const createProjectionUseCase = new CreateProjectionUseCase(
  projectionRepository,
  studentRepository,
  schoolRepository,
  schoolYearRepository,
  monthlyAssignmentRepository
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
  alennaProjectionGenerator,
  monthlyAssignmentRepository
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

const updateGradeUseCase = new UpdateGradeUseCase(
  projectionRepository
);

const markUngradedUseCase = new MarkUngradedUseCase(
  projectionRepository
);

const getDailyGoalsUseCase = new GetDailyGoalsUseCase(
  projectionRepository,
  dailyGoalRepository
);

const createDailyGoalUseCase = new CreateDailyGoalUseCase(
  projectionRepository,
  dailyGoalRepository
);

const addNoteToDailyGoalUseCase = new AddNoteToDailyGoalUseCase(
  dailyGoalRepository
);

const markDailyGoalCompleteUseCase = new MarkDailyGoalCompleteUseCase(
  dailyGoalRepository
);

// Category Use Cases
const getCategoriesWithSubjectsUseCase = new GetCategoriesWithSubjectsUseCase(
  categoryRepository
);

// School Use Cases
const getSchoolWithCurrentYearByUserIdUseCase = new GetSchoolWithCurrentYearByUserIdUseCase(
  schoolRepository
);

const getCurrentWeekUseCase = new GetCurrentWeekUseCase(
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

// Monthly Goals Use Cases
const createMonthlyAssignmentTemplateUseCase = new CreateMonthlyAssignmentTemplateUseCase(
  monthlyAssignmentRepository,
  schoolYearRepository
);

const getMonthlyAssignmentsUseCase = new GetMonthlyAssignmentsUseCase(
  monthlyAssignmentRepository
);

const updateMonthlyAssignmentTemplateUseCase = new UpdateMonthlyAssignmentTemplateUseCase(
  monthlyAssignmentRepository
);

const deleteMonthlyAssignmentTemplateUseCase = new DeleteMonthlyAssignmentTemplateUseCase(
  monthlyAssignmentRepository
);

const createQuarterPercentageUseCase = new CreateQuarterPercentageUseCase(
  monthlyAssignmentRepository,
  schoolYearRepository
);

const getProjectionMonthlyAssignmentsUseCase = new GetProjectionMonthlyAssignmentsUseCase(
  monthlyAssignmentRepository,
  projectionRepository
);

const updateMonthlyAssignmentGradeUseCase = new UpdateMonthlyAssignmentGradeUseCase(
  monthlyAssignmentRepository,
  projectionRepository
);

const markMonthlyAssignmentUngradedUseCase = new MarkMonthlyAssignmentUngradedUseCase(
  monthlyAssignmentRepository,
  projectionRepository
);

// Auth Use Cases
const setupPasswordUseCase = new SetupPasswordUseCase(
  userRepository
);

const getUserInfoUseCase = new GetUserInfoUseCase(
  userRepository
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
    dailyGoalRepository,
    monthlyAssignmentRepository,
    userRepository,
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
    updateGradeUseCase,
    markUngradedUseCase,
    getDailyGoalsUseCase,
    createDailyGoalUseCase,
    addNoteToDailyGoalUseCase,
    markDailyGoalCompleteUseCase,
    // Category Use Cases
    getCategoriesWithSubjectsUseCase,
    // School Use Cases
    getSchoolWithCurrentYearByUserIdUseCase,
    getCurrentWeekUseCase,
    // Student Use Cases
    getEnrolledWithoutOpenProjectionUseCase,
    // Subject Use Cases
    getSubjectAndNextLevelsWithPacesUseCase,
    // Monthly Goals Use Cases
    createMonthlyAssignmentTemplateUseCase,
    getMonthlyAssignmentsUseCase,
    updateMonthlyAssignmentTemplateUseCase,
    deleteMonthlyAssignmentTemplateUseCase,
    createQuarterPercentageUseCase,
    getProjectionMonthlyAssignmentsUseCase,
    updateMonthlyAssignmentGradeUseCase,
    markMonthlyAssignmentUngradedUseCase,
    // Auth Use Cases
    setupPasswordUseCase,
    getUserInfoUseCase,
  },
};
