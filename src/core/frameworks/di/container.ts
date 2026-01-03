// Dependency Injection Container
// This is where we wire up all dependencies following Clean Architecture

import {
  SchoolRepository,
  UserRepository,
  StudentRepository,
  ProjectionRepository,
  ProjectionTemplateRepository,
  SchoolYearRepository,
  DailyGoalRepository,
  RoleRepository,
  GroupRepository,
  TuitionConfigRepository,
  StudentScholarshipRepository,
  RecurringExtraChargeRepository,
  BillingRecordRepository,
  TuitionTypeRepository,
  StudentBillingConfigRepository,
} from '../database/repositories';
import { CharacterTraitRepository } from '../database/repositories/CharacterTraitRepository';
import {
  SyncUserUseCase,
  GetCurrentUserUseCase,
  CreateSchoolUseCase,
  GetSchoolUseCase,
  GetAllSchoolsUseCase,
  UpdateSchoolUseCase,
  DeleteSchoolUseCase,
  ActivateSchoolUseCase,
  DeactivateSchoolUseCase,
  GetUsersUseCase,
  GetRolesUseCase,
  CreateUserUseCase,
  UpdateUserUseCase,
  DeactivateUserUseCase,
  ReactivateUserUseCase,
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
  GenerateProjectionUseCase,
  AddPaceToProjectionUseCase,
  RemovePaceFromProjectionUseCase,
  UpdatePaceGradeUseCase,
  MovePaceUseCase,
  MarkPaceIncompleteUseCase,
  GetPaceCatalogUseCase,
  GetSubSubjectsUseCase,
  CreateSubSubjectWithPacesUseCase,
  GetProjectionTemplatesUseCase,
  GetProjectionTemplateByLevelUseCase,
  CreateDefaultTemplatesUseCase,
  CreateSchoolYearUseCase,
  GetSchoolYearsUseCase,
  GetSchoolYearByIdUseCase,
  UpdateSchoolYearUseCase,
  DeleteSchoolYearUseCase,
  SetActiveSchoolYearUseCase,
  GetCurrentWeekUseCase,
  PreviewQuarterWeeksUseCase,
  CloseQuarterUseCase,
  GetQuartersStatusUseCase,
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
import { GenerateProjectionFromDefaultTemplateUseCase } from '../../app/use-cases/projections/GenerateProjectionFromDefaultTemplateUseCase';
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

import {
  GetGroupsBySchoolYearUseCase,
  GetGroupByIdUseCase,
  CreateGroupUseCase,
  DeleteGroupUseCase,
  GetStudentsByTeacherUseCase,
  AddStudentsToGroupUseCase,
  RemoveStudentFromGroupUseCase,
  GetGroupStudentsUseCase,
  GetStudentAssignmentsForSchoolYearUseCase,
} from '../../app/use-cases/groups';

import {
  GetAllModulesUseCase,
  GetSchoolModulesUseCase,
  EnableSchoolModuleUseCase,
  DisableSchoolModuleUseCase,
} from '../../app/use-cases/modules';

class Container {
  // Repositories (Singleton instances)
  private _schoolRepository?: SchoolRepository;
  private _userRepository?: UserRepository;
  private _studentRepository?: StudentRepository;
  private _projectionRepository?: ProjectionRepository;
  private _projectionTemplateRepository?: ProjectionTemplateRepository;
  private _schoolYearRepository?: SchoolYearRepository;
  private _dailyGoalRepository?: DailyGoalRepository;
  private _roleRepository?: RoleRepository;
  private _groupRepository?: GroupRepository;

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

  get projectionTemplateRepository(): ProjectionTemplateRepository {
    if (!this._projectionTemplateRepository) {
      this._projectionTemplateRepository = new ProjectionTemplateRepository();
    }
    return this._projectionTemplateRepository;
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

  get groupRepository(): GroupRepository {
    if (!this._groupRepository) {
      this._groupRepository = new GroupRepository();
    }
    return this._groupRepository;
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

  get activateSchoolUseCase(): ActivateSchoolUseCase {
    return new ActivateSchoolUseCase(this.schoolRepository, this.userRepository);
  }

  get deactivateSchoolUseCase(): DeactivateSchoolUseCase {
    return new DeactivateSchoolUseCase(this.schoolRepository, this.userRepository);
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

  get deactivateUserUseCase(): DeactivateUserUseCase {
    return new DeactivateUserUseCase(this.userRepository);
  }

  get reactivateUserUseCase(): ReactivateUserUseCase {
    return new ReactivateUserUseCase(this.userRepository);
  }

  get deleteUserUseCase(): DeleteUserUseCase {
    return new DeleteUserUseCase(this.userRepository);
  }

  // Student Use Cases
  get createStudentUseCase(): CreateStudentUseCase {
    return new CreateStudentUseCase(this.studentRepository);
  }

  get getStudentsUseCase(): GetStudentsUseCase {
    return new GetStudentsUseCase(this.studentRepository, this.schoolYearRepository);
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

  get generateProjectionUseCase(): GenerateProjectionUseCase {
    return new GenerateProjectionUseCase(this.projectionRepository);
  }

  get generateProjectionFromDefaultTemplateUseCase(): GenerateProjectionFromDefaultTemplateUseCase {
    return new GenerateProjectionFromDefaultTemplateUseCase(this.projectionRepository);
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

  // SubSubject Use Cases
  get getSubSubjectsUseCase(): GetSubSubjectsUseCase {
    return new GetSubSubjectsUseCase();
  }

  get createSubSubjectWithPacesUseCase(): CreateSubSubjectWithPacesUseCase {
    return new CreateSubSubjectWithPacesUseCase();
  }

  // Projection Template Use Cases
  get getProjectionTemplatesUseCase(): GetProjectionTemplatesUseCase {
    return new GetProjectionTemplatesUseCase(this.projectionTemplateRepository);
  }

  get getProjectionTemplateByLevelUseCase(): GetProjectionTemplateByLevelUseCase {
    return new GetProjectionTemplateByLevelUseCase(this.projectionTemplateRepository);
  }

  get createDefaultTemplatesUseCase(): CreateDefaultTemplatesUseCase {
    return new CreateDefaultTemplatesUseCase(this.projectionTemplateRepository);
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

  get previewQuarterWeeksUseCase(): PreviewQuarterWeeksUseCase {
    return new PreviewQuarterWeeksUseCase();
  }

  // Quarter Use Cases
  get closeQuarterUseCase(): CloseQuarterUseCase {
    return new CloseQuarterUseCase();
  }

  get getQuartersStatusUseCase(): GetQuartersStatusUseCase {
    return new GetQuartersStatusUseCase();
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

  // Groups Use Cases
  get getGroupsBySchoolYearUseCase(): GetGroupsBySchoolYearUseCase {
    return new GetGroupsBySchoolYearUseCase(this.groupRepository);
  }

  get getGroupByIdUseCase(): GetGroupByIdUseCase {
    return new GetGroupByIdUseCase(this.groupRepository);
  }

  get createGroupUseCase(): CreateGroupUseCase {
    return new CreateGroupUseCase(this.groupRepository);
  }

  get deleteGroupUseCase(): DeleteGroupUseCase {
    return new DeleteGroupUseCase(this.groupRepository);
  }

  get getStudentsByTeacherUseCase(): GetStudentsByTeacherUseCase {
    return new GetStudentsByTeacherUseCase(this.groupRepository);
  }

  get addStudentsToGroupUseCase(): AddStudentsToGroupUseCase {
    return new AddStudentsToGroupUseCase(this.groupRepository);
  }

  get removeStudentFromGroupUseCase(): RemoveStudentFromGroupUseCase {
    return new RemoveStudentFromGroupUseCase(this.groupRepository);
  }

  get getGroupStudentsUseCase(): GetGroupStudentsUseCase {
    return new GetGroupStudentsUseCase(this.groupRepository);
  }

  get getStudentAssignmentsForSchoolYearUseCase(): GetStudentAssignmentsForSchoolYearUseCase {
    return new GetStudentAssignmentsForSchoolYearUseCase(this.groupRepository);
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
      this.getCurrentWeekUseCase,
      this.previewQuarterWeeksUseCase
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

  // Module Use Cases
  get getAllModulesUseCase(): GetAllModulesUseCase {
    return new GetAllModulesUseCase();
  }

  get getSchoolModulesUseCase(): GetSchoolModulesUseCase {
    return new GetSchoolModulesUseCase();
  }

  get enableSchoolModuleUseCase(): EnableSchoolModuleUseCase {
    return new EnableSchoolModuleUseCase();
  }

  get disableSchoolModuleUseCase(): DisableSchoolModuleUseCase {
    return new DisableSchoolModuleUseCase();
  }

  // Billing Repositories
  private _tuitionConfigRepository?: TuitionConfigRepository;
  private _studentScholarshipRepository?: StudentScholarshipRepository;
  private _recurringExtraChargeRepository?: RecurringExtraChargeRepository;
  private _billingRecordRepository?: BillingRecordRepository;
  private _tuitionTypeRepository?: TuitionTypeRepository;
  private _studentBillingConfigRepository?: StudentBillingConfigRepository;
  // Character Trait Repository
  private _characterTraitRepository?: CharacterTraitRepository;

  get tuitionConfigRepository(): TuitionConfigRepository {
    if (!this._tuitionConfigRepository) {
      this._tuitionConfigRepository = new TuitionConfigRepository();
    }
    return this._tuitionConfigRepository;
  }

  get studentScholarshipRepository(): StudentScholarshipRepository {
    if (!this._studentScholarshipRepository) {
      this._studentScholarshipRepository = new StudentScholarshipRepository();
    }
    return this._studentScholarshipRepository;
  }

  get recurringExtraChargeRepository(): RecurringExtraChargeRepository {
    if (!this._recurringExtraChargeRepository) {
      this._recurringExtraChargeRepository = new RecurringExtraChargeRepository();
    }
    return this._recurringExtraChargeRepository;
  }

  get billingRecordRepository(): BillingRecordRepository {
    if (!this._billingRecordRepository) {
      this._billingRecordRepository = new BillingRecordRepository();
    }
    return this._billingRecordRepository;
  }

  get tuitionTypeRepository(): TuitionTypeRepository {
    if (!this._tuitionTypeRepository) {
      this._tuitionTypeRepository = new TuitionTypeRepository();
    }
    return this._tuitionTypeRepository;
  }

  get studentBillingConfigRepository(): StudentBillingConfigRepository {
    if (!this._studentBillingConfigRepository) {
      this._studentBillingConfigRepository = new StudentBillingConfigRepository();
    }
    return this._studentBillingConfigRepository;
  }

  get characterTraitRepository(): CharacterTraitRepository {
    if (!this._characterTraitRepository) {
      this._characterTraitRepository = new CharacterTraitRepository();
    }
    return this._characterTraitRepository;
  }

  // Billing Use Cases
  get createBillingRecordUseCase() {
    const { CreateBillingRecordUseCase } = require('../../app/use-cases/billing');
    return new CreateBillingRecordUseCase(
      this.billingRecordRepository,
      this.tuitionConfigRepository,
      this.studentScholarshipRepository,
      this.tuitionTypeRepository,
      this.studentRepository
    );
  }

  get bulkCreateBillingRecordsUseCase() {
    const { BulkCreateBillingRecordsUseCase } = require('../../app/use-cases/billing');
    return new BulkCreateBillingRecordsUseCase(
      this.billingRecordRepository,
      this.tuitionConfigRepository,
      this.studentScholarshipRepository,
      this.tuitionTypeRepository,
      this.studentRepository,
      this.recurringExtraChargeRepository
    );
  }

  get bulkUpdateBillingRecordsUseCase() {
    const { BulkUpdateBillingRecordsUseCase } = require('../../app/use-cases/billing');
    return new BulkUpdateBillingRecordsUseCase(
      this.billingRecordRepository,
      this.tuitionConfigRepository,
      this.studentScholarshipRepository,
      this.tuitionTypeRepository,
      this.recurringExtraChargeRepository
    );
  }

  get updateBillingRecordUseCase() {
    const { UpdateBillingRecordUseCase } = require('../../app/use-cases/billing');
    return new UpdateBillingRecordUseCase(this.billingRecordRepository);
  }

  get recordManualPaymentUseCase() {
    const { RecordManualPaymentUseCase } = require('../../app/use-cases/billing');
    return new RecordManualPaymentUseCase(this.billingRecordRepository);
  }

  get recordPartialPaymentUseCase() {
    const { RecordPartialPaymentUseCase } = require('../../app/use-cases/billing');
    return new RecordPartialPaymentUseCase(this.billingRecordRepository);
  }

  get updateTaxableBillStatusUseCase() {
    const { UpdateTaxableBillStatusUseCase } = require('../../app/use-cases/billing');
    return new UpdateTaxableBillStatusUseCase(this.billingRecordRepository);
  }

  get applyLateFeeUseCase() {
    const { ApplyLateFeeUseCase } = require('../../app/use-cases/billing');
    return new ApplyLateFeeUseCase(this.billingRecordRepository);
  }

  get bulkApplyLateFeeUseCase() {
    const { BulkApplyLateFeeUseCase } = require('../../app/use-cases/billing');
    return new BulkApplyLateFeeUseCase(this.billingRecordRepository);
  }

  get getBillingRecordsUseCase() {
    const { GetBillingRecordsUseCase } = require('../../app/use-cases/billing');
    return new GetBillingRecordsUseCase(this.billingRecordRepository);
  }

  get getBillingAggregatedFinancialsUseCase() {
    const { GetBillingAggregatedFinancialsUseCase } = require('../../app/use-cases/billing');
    return new GetBillingAggregatedFinancialsUseCase(this.billingRecordRepository);
  }

  get getBillingRecordByIdUseCase() {
    const { GetBillingRecordByIdUseCase } = require('../../app/use-cases/billing');
    return new GetBillingRecordByIdUseCase(this.billingRecordRepository);
  }

  get createTuitionConfigUseCase() {
    const { CreateTuitionConfigUseCase } = require('../../app/use-cases/billing');
    return new CreateTuitionConfigUseCase(this.tuitionConfigRepository);
  }

  get getTuitionConfigUseCase() {
    const { GetTuitionConfigUseCase } = require('../../app/use-cases/billing');
    return new GetTuitionConfigUseCase(this.tuitionConfigRepository);
  }

  get updateTuitionConfigUseCase() {
    const { UpdateTuitionConfigUseCase } = require('../../app/use-cases/billing');
    return new UpdateTuitionConfigUseCase(this.tuitionConfigRepository);
  }

  get createStudentScholarshipUseCase() {
    const { CreateStudentScholarshipUseCase } = require('../../app/use-cases/billing');
    return new CreateStudentScholarshipUseCase(this.studentScholarshipRepository, this.studentRepository);
  }

  get getStudentScholarshipUseCase() {
    const { GetStudentScholarshipUseCase } = require('../../app/use-cases/billing');
    return new GetStudentScholarshipUseCase(this.studentScholarshipRepository);
  }

  get getStudentsBillingOverviewQuery() {
    const { GetStudentsBillingOverviewQuery } = require('../../app/use-cases/billing');
    return new GetStudentsBillingOverviewQuery(
      this.studentRepository,
      this.studentScholarshipRepository,
      this.recurringExtraChargeRepository,
      this.tuitionTypeRepository,
      this.studentBillingConfigRepository
    );
  }

  get getBillingConfigByStudentUseCase() {
    const { GetBillingConfigByStudentUseCase } = require('../../app/use-cases/student-billing-config');
    return new GetBillingConfigByStudentUseCase(this.studentBillingConfigRepository);
  }

  get updateBillingConfigByStudentUseCase() {
    const { UpdateBillingConfigByStudentUseCase } = require('../../app/use-cases/student-billing-config');
    return new UpdateBillingConfigByStudentUseCase(this.studentBillingConfigRepository);
  }

  get updateStudentScholarshipUseCase() {
    const { UpdateStudentScholarshipUseCase } = require('../../app/use-cases/billing');
    return new UpdateStudentScholarshipUseCase(this.studentScholarshipRepository);
  }

  get createRecurringExtraChargeUseCase() {
    const { CreateRecurringExtraChargeUseCase } = require('../../app/use-cases/recurring-extra-charge');
    return new CreateRecurringExtraChargeUseCase(this.recurringExtraChargeRepository);
  }

  get updateRecurringExtraChargeUseCase() {
    const { UpdateRecurringExtraChargeUseCase } = require('../../app/use-cases/recurring-extra-charge');
    return new UpdateRecurringExtraChargeUseCase(this.recurringExtraChargeRepository);
  }

  get getRecurringExtraChargesUseCase() {
    const { GetRecurringExtraChargesUseCase } = require('../../app/use-cases/recurring-extra-charge');
    return new GetRecurringExtraChargesUseCase(this.recurringExtraChargeRepository);
  }

  get deleteRecurringExtraChargeUseCase() {
    const { DeleteRecurringExtraChargeUseCase } = require('../../app/use-cases/recurring-extra-charge');
    return new DeleteRecurringExtraChargeUseCase(this.recurringExtraChargeRepository);
  }

  get getBillingMetricsUseCase() {
    const { GetBillingMetricsUseCase } = require('../../app/use-cases/billing');
    return new GetBillingMetricsUseCase(this.billingRecordRepository);
  }

  get getBillingDashboardDataUseCase() {
    const { GetBillingDashboardDataUseCase } = require('../../app/use-cases/billing');
    return new GetBillingDashboardDataUseCase(this.billingRecordRepository);
  }

  get createTuitionTypeUseCase() {
    const { CreateTuitionTypeUseCase } = require('../../app/use-cases/billing');
    return new CreateTuitionTypeUseCase(this.tuitionTypeRepository);
  }

  get updateTuitionTypeUseCase() {
    const { UpdateTuitionTypeUseCase } = require('../../app/use-cases/billing');
    return new UpdateTuitionTypeUseCase(this.tuitionTypeRepository);
  }

  get getTuitionTypesUseCase() {
    const { GetTuitionTypesUseCase } = require('../../app/use-cases/billing');
    return new GetTuitionTypesUseCase(this.tuitionTypeRepository);
  }

  get deleteTuitionTypeUseCase() {
    const { DeleteTuitionTypeUseCase } = require('../../app/use-cases/billing');
    return new DeleteTuitionTypeUseCase(this.tuitionTypeRepository);
  }

  // Character Trait Use Cases
  get createCharacterTraitUseCase() {
    const { CreateCharacterTraitUseCase } = require('../../app/use-cases/character-trait');
    return new CreateCharacterTraitUseCase(this.characterTraitRepository);
  }

  get updateCharacterTraitUseCase() {
    const { UpdateCharacterTraitUseCase } = require('../../app/use-cases/character-trait');
    return new UpdateCharacterTraitUseCase(this.characterTraitRepository);
  }

  get getCharacterTraitUseCase() {
    const { GetCharacterTraitUseCase } = require('../../app/use-cases/character-trait');
    return new GetCharacterTraitUseCase(this.characterTraitRepository);
  }

  get getCharacterTraitsBySchoolYearUseCase() {
    const { GetCharacterTraitsBySchoolYearUseCase } = require('../../app/use-cases/character-trait');
    return new GetCharacterTraitsBySchoolYearUseCase(this.characterTraitRepository);
  }

  get getCharacterTraitByMonthUseCase() {
    const { GetCharacterTraitByMonthUseCase } = require('../../app/use-cases/character-trait');
    return new GetCharacterTraitByMonthUseCase(this.characterTraitRepository);
  }

  get deleteCharacterTraitUseCase() {
    const { DeleteCharacterTraitUseCase } = require('../../app/use-cases/character-trait');
    return new DeleteCharacterTraitUseCase(this.characterTraitRepository);
  }
}

// Export singleton instance
export const container = new Container();

