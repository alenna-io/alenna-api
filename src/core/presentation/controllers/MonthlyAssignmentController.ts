import { Request, Response } from 'express';
import { container } from '../../infrastructure/frameworks/di/container';
import {
  CreateMonthlyAssignmentTemplateDTO,
  UpdateMonthlyAssignmentTemplateDTO,
  CreateQuarterPercentageDTO,
  UpdateMonthlyAssignmentGradeDTO
} from '../../application/dtos/monthly-assignments';
import {
  CreateMonthlyAssignmentTemplateUseCase,
  GetMonthlyAssignmentsUseCase,
  UpdateMonthlyAssignmentTemplateUseCase,
  DeleteMonthlyAssignmentTemplateUseCase,
  CreateQuarterPercentageUseCase,
  GetProjectionMonthlyAssignmentsUseCase,
  UpdateMonthlyAssignmentGradeUseCase,
  MarkMonthlyAssignmentUngradedUseCase
} from '../../application/use-cases/monthly-assignments';
import { InvalidEntityError } from '../../domain/errors';
import { validateCuid } from '../../domain/utils/validation';

export class MonthlyAssignmentController {
  constructor(
    private readonly createTemplate: CreateMonthlyAssignmentTemplateUseCase = container.useCase.createMonthlyAssignmentTemplateUseCase,
    private readonly getMonthlyAssignments: GetMonthlyAssignmentsUseCase = container.useCase.getMonthlyAssignmentsUseCase,
    private readonly updateTemplate: UpdateMonthlyAssignmentTemplateUseCase = container.useCase.updateMonthlyAssignmentTemplateUseCase,
    private readonly deleteTemplate: DeleteMonthlyAssignmentTemplateUseCase = container.useCase.deleteMonthlyAssignmentTemplateUseCase,
    private readonly createPercentage: CreateQuarterPercentageUseCase = container.useCase.createQuarterPercentageUseCase,
    private readonly getProjectionMonthlyAssignments: GetProjectionMonthlyAssignmentsUseCase = container.useCase.getProjectionMonthlyAssignmentsUseCase,
    private readonly updateGrade: UpdateMonthlyAssignmentGradeUseCase = container.useCase.updateMonthlyAssignmentGradeUseCase,
    private readonly markUngraded: MarkMonthlyAssignmentUngradedUseCase = container.useCase.markMonthlyAssignmentUngradedUseCase
  ) { }

  async createTemplateHandler(req: Request, res: Response): Promise<Response> {
    const schoolYearId = req.params.schoolYearId;
    const schoolId = req.schoolId;
    if (!schoolYearId) {
      throw new InvalidEntityError('SchoolYear', 'School year ID is required');
    }
    if (!schoolId) {
      throw new InvalidEntityError('School', 'School ID is required');
    }
    validateCuid(schoolYearId, 'SchoolYear');
    validateCuid(schoolId, 'School');

    const input = CreateMonthlyAssignmentTemplateDTO.parse(req.body);
    const result = await this.createTemplate.execute(schoolYearId, schoolId, input);

    if (!result.success) {
      throw result.error;
    }

    return res.status(201).json(result.data);
  }

  async getMonthlyAssignmentsHandler(req: Request, res: Response): Promise<Response> {
    const schoolYearId = req.params.schoolYearId;
    if (!schoolYearId) {
      throw new InvalidEntityError('SchoolYear', 'School year ID is required');
    }
    validateCuid(schoolYearId, 'SchoolYear');

    const result = await this.getMonthlyAssignments.execute(schoolYearId);

    if (!result.success) {
      throw result.error;
    }

    return res.status(200).json(result.data);
  }

  async updateTemplateHandler(req: Request, res: Response): Promise<Response> {
    const templateId = req.params.templateId;
    const schoolId = req.schoolId;
    if (!templateId) {
      throw new InvalidEntityError('MonthlyAssignmentTemplate', 'Template ID is required');
    }
    if (!schoolId) {
      throw new InvalidEntityError('School', 'School ID is required');
    }
    validateCuid(templateId, 'MonthlyAssignmentTemplate');
    validateCuid(schoolId, 'School');

    const input = UpdateMonthlyAssignmentTemplateDTO.parse(req.body);
    const result = await this.updateTemplate.execute(templateId, schoolId, input);

    if (!result.success) {
      throw result.error;
    }

    return res.status(200).json(result.data);
  }

  async deleteTemplateHandler(req: Request, res: Response): Promise<Response> {
    const templateId = req.params.templateId;
    const schoolId = req.schoolId;
    if (!templateId) {
      throw new InvalidEntityError('MonthlyAssignmentTemplate', 'Template ID is required');
    }
    if (!schoolId) {
      throw new InvalidEntityError('School', 'School ID is required');
    }
    validateCuid(templateId, 'MonthlyAssignmentTemplate');
    validateCuid(schoolId, 'School');

    const result = await this.deleteTemplate.execute(templateId, schoolId);

    if (!result.success) {
      throw result.error;
    }

    return res.status(204).send();
  }

  async createPercentageHandler(req: Request, res: Response): Promise<Response> {
    const schoolYearId = req.params.schoolYearId;
    const schoolId = req.schoolId;
    if (!schoolYearId) {
      throw new InvalidEntityError('SchoolYear', 'School year ID is required');
    }
    if (!schoolId) {
      throw new InvalidEntityError('School', 'School ID is required');
    }
    validateCuid(schoolYearId, 'SchoolYear');
    validateCuid(schoolId, 'School');

    const input = CreateQuarterPercentageDTO.parse(req.body);
    const result = await this.createPercentage.execute(schoolYearId, schoolId, input);

    if (!result.success) {
      throw result.error;
    }

    return res.status(201).json(result.data);
  }

  async getProjectionMonthlyAssignmentsHandler(req: Request, res: Response): Promise<Response> {
    const projectionId = req.params.projectionId;
    const schoolId = req.schoolId;
    if (!projectionId) {
      throw new InvalidEntityError('Projection', 'Projection ID is required');
    }
    if (!schoolId) {
      throw new InvalidEntityError('School', 'School ID is required');
    }
    validateCuid(projectionId, 'Projection');
    validateCuid(schoolId, 'School');

    const result = await this.getProjectionMonthlyAssignments.execute(projectionId, schoolId);

    if (!result.success) {
      throw result.error;
    }

    // Convert Decimal grades to numbers for JSON response
    const convertedData = result.data.map(assignment => ({
      ...assignment,
      grade: assignment.grade ? assignment.grade.toNumber() : null,
      gradeHistory: assignment.gradeHistory.map(history => ({
        ...history,
        grade: history.grade.toNumber(),
      })),
    }));

    return res.status(200).json(convertedData);
  }

  async updateGradeHandler(req: Request, res: Response): Promise<Response> {
    const projectionId = req.params.projectionId;
    const monthlyAssignmentId = req.params.monthlyAssignmentId;
    const schoolId = req.schoolId;
    if (!projectionId) {
      throw new InvalidEntityError('Projection', 'Projection ID is required');
    }
    if (!monthlyAssignmentId) {
      throw new InvalidEntityError('ProjectionMonthlyAssignment', 'Monthly assignment ID is required');
    }
    if (!schoolId) {
      throw new InvalidEntityError('School', 'School ID is required');
    }
    validateCuid(projectionId, 'Projection');
    validateCuid(monthlyAssignmentId, 'ProjectionMonthlyAssignment');
    validateCuid(schoolId, 'School');

    const input = UpdateMonthlyAssignmentGradeDTO.parse(req.body);
    const result = await this.updateGrade.execute(projectionId, schoolId, monthlyAssignmentId, input);

    if (!result.success) {
      throw result.error;
    }

    // Convert Decimal to number for JSON response
    const response: any = {
      ...result.data,
      grade: result.data.grade ? result.data.grade.toNumber() : null,
    };

    // Handle gradeHistory if it exists
    if ('gradeHistory' in result.data && Array.isArray(result.data.gradeHistory)) {
      response.gradeHistory = result.data.gradeHistory.map((h: any) => ({
        ...h,
        grade: h.grade.toNumber(),
      }));
    }

    return res.status(200).json(response);
  }

  async markUngradedHandler(req: Request, res: Response): Promise<Response> {
    const projectionId = req.params.projectionId;
    const monthlyAssignmentId = req.params.monthlyAssignmentId;
    const schoolId = req.schoolId;
    if (!projectionId) {
      throw new InvalidEntityError('Projection', 'Projection ID is required');
    }
    if (!monthlyAssignmentId) {
      throw new InvalidEntityError('ProjectionMonthlyAssignment', 'Monthly assignment ID is required');
    }
    if (!schoolId) {
      throw new InvalidEntityError('School', 'School ID is required');
    }
    validateCuid(projectionId, 'Projection');
    validateCuid(monthlyAssignmentId, 'ProjectionMonthlyAssignment');
    validateCuid(schoolId, 'School');

    const result = await this.markUngraded.execute(projectionId, schoolId, monthlyAssignmentId);

    if (!result.success) {
      throw result.error;
    }

    return res.status(200).json(result.data);
  }
}
