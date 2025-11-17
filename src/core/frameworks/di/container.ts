// Dependency Injection Container
// This is where we wire up all dependencies following Clean Architecture

import {
  SchoolRepository,
  UserRepository,
  StudentRepository,
  ProjectionRepository,
  SchoolYearRepository,
  DailyGoalRepository,
  RoleRepository
} from '../database/repositories';
import {
  SyncUserUseCase,
  GetCurrentUserUseCase,
  CreateSchoolUseCase,
  GetSchoolUseCase,
  GetAllSchoolsUseCase,
  UpdateSchoolUseCase,
  DeleteSchoolUseCase,
  GetUsersUseCase,
  GetRolesUseCase,
  CreateUserUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
  CreateStudentUseCase,
  GetStudentsUseCase,
  GetStudentByIdUseCase,
  UpdateStudentUseCase,
  DeleteStudentUseCase,
  CreateProjectionUseCase,
  GetProjectionsByStudentIdUseCase,
  GetAllProjectionsUseCase,
  GetProjectionByIdUseCase,
  GetProjectionDetailUseCase,
  UpdateProjectionUseCase,
  DeleteProjectionUseCase,
  AddPaceToProjectionUseCase,
  RemovePaceFromProjectionUseCase,
  UpdatePaceGradeUseCase,
  MovePaceUseCase,
  MarkPaceIncompleteUseCase,
  GetPaceCatalogUseCase,
  CreateSchoolYearUseCase,
  GetSchoolYearsUseCase,
  GetSchoolYearByIdUseCase,
  UpdateSchoolYearUseCase,
  DeleteSchoolYearUseCase,
  SetActiveSchoolYearUseCase,
  GetCurrentWeekUseCase,
  CreateDailyGoalUseCase,
  UpdateDailyGoalUseCase,
  GetDailyGoalsUseCase,
  GetDailyGoalsByProjectionUseCase,
  UpdateDailyGoalCompletionUseCase,
  UpdateDailyGoalNotesUseCase,
  AddNoteToHistoryUseCase,
  GetNoteHistoryUseCase,
  DeleteDailyGoalUseCase,
} from '../../app/use-cases';
import { GetReportCardUseCase } from '../../app/use-cases/report-cards';
import {
  CreateSchoolMonthlyAssignmentTemplateUseCase,
  GetSchoolMonthlyAssignmentTemplatesUseCase,
  DeleteSchoolMonthlyAssignmentTemplateUseCase,
  UpdateSchoolMonthlyAssignmentTemplateUseCase,
  UpdateQuarterGradePercentageUseCase,
  GetQuarterGradePercentagesUseCase,
} from '../../app/use-cases/school-monthly-assignments';

import {
  CreateMonthlyAssignmentUseCase,
  UpdateMonthlyAssignmentUseCase,
  GradeMonthlyAssignmentUseCase,
  DeleteMonthlyAssignmentUseCase,
  GetMonthlyAssignmentsByProjectionUseCase,
} from '../../app/use-cases/monthly-assignments';

class Container {
  // Repositories (Singleton instances)
  private _schoolRepository?: SchoolRepository;
  private _userRepository?: UserRepository;
  private _studentRepository?: StudentRepository;
  private _projectionRepository?: ProjectionRepository;
  private _schoolYearRepository?: SchoolYearRepository;
  private _dailyGoalRepository?: DailyGoalRepository;
  private _roleRepository?: RoleRepository;

  // Repositories getters (Lazy initialization)
  get schoolRepository(): SchoolRepository {
    if (!this._schoolRepository) {
      this._schoolRepository = new SchoolRepository();
    }
    return this._schoolRepository;
  }

  get userRepository(): UserRepository {
    if (!this._userRepository) {
      this._userRepository = new UserRepository();
    }
    return this._userRepository;
  }

  get studentRepository(): StudentRepository {
    if (!this._studentRepository) {
      this._studentRepository = new StudentRepository();
    }
    return this._studentRepository;
  }

  get projectionRepository(): ProjectionRepository {
    if (!this._projectionRepository) {
      this._projectionRepository = new ProjectionRepository();
    }
    return this._projectionRepository;
  }

  get schoolYearRepository(): SchoolYearRepository {
    if (!this._schoolYearRepository) {
      this._schoolYearRepository = new SchoolYearRepository();
    }
    return this._schoolYearRepository;
  }

  get dailyGoalRepository(): DailyGoalRepository {
    if (!this._dailyGoalRepository) {
      this._dailyGoalRepository = new DailyGoalRepository();
    }
    return this._dailyGoalRepository;
  }

  get roleRepository(): RoleRepository {
    if (!this._roleRepository) {
      this._roleRepository = new RoleRepository();
    }
    return this._roleRepository;
  }

  // Auth Use Cases
  get syncUserUseCase(): SyncUserUseCase {
    return new SyncUserUseCase(this.userRepository);
  }

  get getCurrentUserUseCase(): GetCurrentUserUseCase {
    return new GetCurrentUserUseCase(this.userRepository);
  }

  // School Use Cases
  get createSchoolUseCase(): CreateSchoolUseCase {
    return new CreateSchoolUseCase(this.schoolRepository);
  }

  get getSchoolUseCase(): GetSchoolUseCase {
    return new GetSchoolUseCase(this.schoolRepository);
  }

  get getAllSchoolsUseCase(): GetAllSchoolsUseCase {
    return new GetAllSchoolsUseCase(this.schoolRepository);
  }

  get updateSchoolUseCase(): UpdateSchoolUseCase {
    return new UpdateSchoolUseCase(this.schoolRepository);
  }

  get deleteSchoolUseCase(): DeleteSchoolUseCase {
    return new DeleteSchoolUseCase(this.schoolRepository);
  }

  // User Use Cases
  get getUsersUseCase(): GetUsersUseCase {
    return new GetUsersUseCase(this.userRepository);
  }

  get getRolesUseCase(): GetRolesUseCase {
    return new GetRolesUseCase(this.roleRepository);
  }

  get createUserUseCase(): CreateUserUseCase {
    return new CreateUserUseCase(this.userRepository);
  }

  get updateUserUseCase(): UpdateUserUseCase {
    return new UpdateUserUseCase(this.userRepository);
  }

  get deleteUserUseCase(): DeleteUserUseCase {
    return new DeleteUserUseCase(this.userRepository);
  }

  // Student Use Cases
  get createStudentUseCase(): CreateStudentUseCase {
    return new CreateStudentUseCase(this.studentRepository);
  }

  get getStudentsUseCase(): GetStudentsUseCase {
    return new GetStudentsUseCase(this.studentRepository);
  }

  get getStudentByIdUseCase(): GetStudentByIdUseCase {
    return new GetStudentByIdUseCase(this.studentRepository);
  }

  get updateStudentUseCase(): UpdateStudentUseCase {
    return new UpdateStudentUseCase(this.studentRepository);
  }

  get deleteStudentUseCase(): DeleteStudentUseCase {
    return new DeleteStudentUseCase(this.studentRepository);
  }

  // Projection Use Cases
  get createProjectionUseCase(): CreateProjectionUseCase {
    return new CreateProjectionUseCase(this.projectionRepository);
  }

  get getProjectionsByStudentIdUseCase(): GetProjectionsByStudentIdUseCase {
    return new GetProjectionsByStudentIdUseCase(this.projectionRepository);
  }

  get getAllProjectionsUseCase(): GetAllProjectionsUseCase {
    return new GetAllProjectionsUseCase();
  }

  get getProjectionByIdUseCase(): GetProjectionByIdUseCase {
    return new GetProjectionByIdUseCase(this.projectionRepository);
  }

  get getProjectionDetailUseCase(): GetProjectionDetailUseCase {
    return new GetProjectionDetailUseCase(this.projectionRepository, this.studentRepository);
  }

  get updateProjectionUseCase(): UpdateProjectionUseCase {
    return new UpdateProjectionUseCase(this.projectionRepository);
  }

  get deleteProjectionUseCase(): DeleteProjectionUseCase {
    return new DeleteProjectionUseCase(this.projectionRepository);
  }

  get addPaceToProjectionUseCase(): AddPaceToProjectionUseCase {
    return new AddPaceToProjectionUseCase(this.projectionRepository);
  }

  get removePaceFromProjectionUseCase(): RemovePaceFromProjectionUseCase {
    return new RemovePaceFromProjectionUseCase(this.projectionRepository);
  }

  get updatePaceGradeUseCase(): UpdatePaceGradeUseCase {
    return new UpdatePaceGradeUseCase(this.projectionRepository);
  }

  get movePaceUseCase(): MovePaceUseCase {
    return new MovePaceUseCase(this.projectionRepository);
  }

  get markPaceIncompleteUseCase(): MarkPaceIncompleteUseCase {
    return new MarkPaceIncompleteUseCase(this.projectionRepository);
  }

  // PACE Catalog Use Cases
  get getPaceCatalogUseCase(): GetPaceCatalogUseCase {
    return new GetPaceCatalogUseCase();
  }

  // School Year Use Cases
  get createSchoolYearUseCase(): CreateSchoolYearUseCase {
    return new CreateSchoolYearUseCase(this.schoolYearRepository);
  }

  get getSchoolYearsUseCase(): GetSchoolYearsUseCase {
    return new GetSchoolYearsUseCase(this.schoolYearRepository);
  }

  get getSchoolYearByIdUseCase(): GetSchoolYearByIdUseCase {
    return new GetSchoolYearByIdUseCase(this.schoolYearRepository);
  }

  get updateSchoolYearUseCase(): UpdateSchoolYearUseCase {
    return new UpdateSchoolYearUseCase(this.schoolYearRepository);
  }

  get deleteSchoolYearUseCase(): DeleteSchoolYearUseCase {
    return new DeleteSchoolYearUseCase(this.schoolYearRepository);
  }

  get setActiveSchoolYearUseCase(): SetActiveSchoolYearUseCase {
    return new SetActiveSchoolYearUseCase(this.schoolYearRepository);
  }

  get getCurrentWeekUseCase(): GetCurrentWeekUseCase {
    return new GetCurrentWeekUseCase(this.schoolYearRepository);
  }

  // Daily Goals Use Cases
  get createDailyGoalUseCase(): CreateDailyGoalUseCase {
    return new CreateDailyGoalUseCase(this.dailyGoalRepository);
  }

  get updateDailyGoalUseCase(): UpdateDailyGoalUseCase {
    return new UpdateDailyGoalUseCase(this.dailyGoalRepository);
  }

  get getDailyGoalsUseCase(): GetDailyGoalsUseCase {
    return new GetDailyGoalsUseCase(this.dailyGoalRepository);
  }

  get getDailyGoalsByProjectionUseCase(): GetDailyGoalsByProjectionUseCase {
    return new GetDailyGoalsByProjectionUseCase(this.dailyGoalRepository);
  }

  get updateDailyGoalCompletionUseCase(): UpdateDailyGoalCompletionUseCase {
    return new UpdateDailyGoalCompletionUseCase(this.dailyGoalRepository);
  }

  get updateDailyGoalNotesUseCase(): UpdateDailyGoalNotesUseCase {
    return new UpdateDailyGoalNotesUseCase(this.dailyGoalRepository);
  }

  get addNoteToHistoryUseCase(): AddNoteToHistoryUseCase {
    return new AddNoteToHistoryUseCase(this.dailyGoalRepository);
  }

  get getNoteHistoryUseCase(): GetNoteHistoryUseCase {
    return new GetNoteHistoryUseCase(this.dailyGoalRepository);
  }

  get deleteDailyGoalUseCase(): DeleteDailyGoalUseCase {
    return new DeleteDailyGoalUseCase(this.dailyGoalRepository);
  }

  // Monthly Assignment Use Cases
  get createMonthlyAssignmentUseCase(): CreateMonthlyAssignmentUseCase {
    return new CreateMonthlyAssignmentUseCase();
  }

  get updateMonthlyAssignmentUseCase(): UpdateMonthlyAssignmentUseCase {
    return new UpdateMonthlyAssignmentUseCase();
  }

  get gradeMonthlyAssignmentUseCase(): GradeMonthlyAssignmentUseCase {
    return new GradeMonthlyAssignmentUseCase();
  }

  get deleteMonthlyAssignmentUseCase(): DeleteMonthlyAssignmentUseCase {
    return new DeleteMonthlyAssignmentUseCase();
  }

  get getMonthlyAssignmentsByProjectionUseCase(): GetMonthlyAssignmentsByProjectionUseCase {
return new GetMonthlyAssignmentsByProjectionUseCase();
  }

  // School Monthly Assignment Use Cases
  get createSchoolMonthlyAssignmentTemplateUseCase(): CreateSchoolMonthlyAssignmentTemplateUseCase {
    return new CreateSchoolMonthlyAssignmentTemplateUseCase();
  }

  get getSchoolMonthlyAssignmentTemplatesUseCase(): GetSchoolMonthlyAssignmentTemplatesUseCase {
    return new GetSchoolMonthlyAssignmentTemplatesUseCase();
  }

  get deleteSchoolMonthlyAssignmentTemplateUseCase(): DeleteSchoolMonthlyAssignmentTemplateUseCase {
    return new DeleteSchoolMonthlyAssignmentTemplateUseCase();
  }

  get updateSchoolMonthlyAssignmentTemplateUseCase(): UpdateSchoolMonthlyAssignmentTemplateUseCase {
    return new UpdateSchoolMonthlyAssignmentTemplateUseCase();
  }

  get updateQuarterGradePercentageUseCase(): UpdateQuarterGradePercentageUseCase {
    return new UpdateQuarterGradePercentageUseCase();
  }

  get getQuarterGradePercentagesUseCase(): GetQuarterGradePercentagesUseCase {
    return new GetQuarterGradePercentagesUseCase();
  }

  // Report Cards Use Cases
  get getReportCardUseCase(): GetReportCardUseCase {
    return new GetReportCardUseCase();
  }

  // Controllers
  get schoolYearController() {
    const { SchoolYearController } = require('../api/controllers');
    return new SchoolYearController(
      this.createSchoolYearUseCase,
      this.getSchoolYearsUseCase,
      this.getSchoolYearByIdUseCase,
      this.updateSchoolYearUseCase,
      this.deleteSchoolYearUseCase,
      this.setActiveSchoolYearUseCase,
      this.getCurrentWeekUseCase
    );
  }

  get schoolMonthlyAssignmentController() {
    const { SchoolMonthlyAssignmentController } = require('../api/controllers');
    return new SchoolMonthlyAssignmentController(
      this.createSchoolMonthlyAssignmentTemplateUseCase,
      this.getSchoolMonthlyAssignmentTemplatesUseCase,
      this.deleteSchoolMonthlyAssignmentTemplateUseCase,
      this.updateSchoolMonthlyAssignmentTemplateUseCase,
      this.updateQuarterGradePercentageUseCase,
      this.getQuarterGradePercentagesUseCase
    );
  }

  get reportCardController() {
    const { ReportCardController } = require('../api/controllers');
    return new ReportCardController(this.getReportCardUseCase);
  }
}

// Export singleton instance
export const container = new Container();

