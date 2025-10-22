// Dependency Injection Container
// This is where we wire up all dependencies following Clean Architecture

import {
  SchoolRepository,
  UserRepository,
  StudentRepository,
  ProjectionRepository,
  SchoolYearRepository
} from '../database/repositories';
import {
  SyncUserUseCase,
  GetCurrentUserUseCase,
  CreateSchoolUseCase,
  GetSchoolUseCase,
  UpdateSchoolUseCase,
  GetUsersUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
  CreateStudentUseCase,
  GetStudentsUseCase,
  GetStudentByIdUseCase,
  UpdateStudentUseCase,
  DeleteStudentUseCase,
  CreateProjectionUseCase,
  GetProjectionsByStudentIdUseCase,
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
} from '../../app/use-cases';

class Container {
  // Repositories (Singleton instances)
  private _schoolRepository?: SchoolRepository;
  private _userRepository?: UserRepository;
  private _studentRepository?: StudentRepository;
  private _projectionRepository?: ProjectionRepository;
  private _schoolYearRepository?: SchoolYearRepository;

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

  get updateSchoolUseCase(): UpdateSchoolUseCase {
    return new UpdateSchoolUseCase(this.schoolRepository);
  }

  // User Use Cases
  get getUsersUseCase(): GetUsersUseCase {
    return new GetUsersUseCase(this.userRepository);
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
}

// Export singleton instance
export const container = new Container();

