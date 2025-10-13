// Dependency Injection Container
// This is where we wire up all dependencies following Clean Architecture

import { SchoolRepository, UserRepository, StudentRepository } from '../database/repositories';
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
} from '../../app/use-cases';

class Container {
  // Repositories (Singleton instances)
  private _schoolRepository?: SchoolRepository;
  private _userRepository?: UserRepository;
  private _studentRepository?: StudentRepository;

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
}

// Export singleton instance
export const container = new Container();

