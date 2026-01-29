import { Request, Response } from 'express';
import { container } from '../../infrastructure/frameworks/di/container';
import {
  CreateMonthlyGoalTemplateDTO,
  UpdateMonthlyGoalTemplateDTO,
  CreateQuarterPercentageDTO,
  UpdateMonthlyGoalGradeDTO
} from '../../application/dtos/monthly-goals';
import {
  CreateMonthlyGoalTemplateUseCase,
  GetMonthlyGoalsUseCase,
  UpdateMonthlyGoalTemplateUseCase,
  DeleteMonthlyGoalTemplateUseCase,
  CreateQuarterPercentageUseCase,
  GetProjectionMonthlyGoalsUseCase,
  UpdateMonthlyGoalGradeUseCase,
  MarkMonthlyGoalUngradedUseCase
} from '../../application/use-cases/monthly-goals';
import { InvalidEntityError } from '../../domain/errors';
import { validateCuid } from '../../domain/utils/validation';

export class MonthlyGoalController {
  constructor(
    private readonly createTemplate: CreateMonthlyGoalTemplateUseCase = container.useCase.createMonthlyGoalTemplateUseCase,
    private readonly getMonthlyGoals: GetMonthlyGoalsUseCase = container.useCase.getMonthlyGoalsUseCase,
    private readonly updateTemplate: UpdateMonthlyGoalTemplateUseCase = container.useCase.updateMonthlyGoalTemplateUseCase,
    private readonly deleteTemplate: DeleteMonthlyGoalTemplateUseCase = container.useCase.deleteMonthlyGoalTemplateUseCase,
    private readonly createPercentage: CreateQuarterPercentageUseCase = container.useCase.createQuarterPercentageUseCase,
    private readonly getProjectionMonthlyGoals: GetProjectionMonthlyGoalsUseCase = container.useCase.getProjectionMonthlyGoalsUseCase,
    private readonly updateGrade: UpdateMonthlyGoalGradeUseCase = container.useCase.updateMonthlyGoalGradeUseCase,
    private readonly markUngraded: MarkMonthlyGoalUngradedUseCase = container.useCase.markMonthlyGoalUngradedUseCase
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

    const input = CreateMonthlyGoalTemplateDTO.parse(req.body);
    const result = await this.createTemplate.execute(schoolYearId, schoolId, input);

    if (!result.success) {
      throw result.error;
    }

    return res.status(201).json(result.data);
  }

  async getMonthlyGoalsHandler(req: Request, res: Response): Promise<Response> {
    const schoolYearId = req.params.schoolYearId;
    if (!schoolYearId) {
      throw new InvalidEntityError('SchoolYear', 'School year ID is required');
    }
    validateCuid(schoolYearId, 'SchoolYear');

    const result = await this.getMonthlyGoals.execute(schoolYearId);

    if (!result.success) {
      throw result.error;
    }

    return res.status(200).json(result.data);
  }

  async updateTemplateHandler(req: Request, res: Response): Promise<Response> {
    const templateId = req.params.templateId;
    const schoolId = req.schoolId;
    if (!templateId) {
      throw new InvalidEntityError('MonthlyGoalTemplate', 'Template ID is required');
    }
    if (!schoolId) {
      throw new InvalidEntityError('School', 'School ID is required');
    }
    validateCuid(templateId, 'MonthlyGoalTemplate');
    validateCuid(schoolId, 'School');

    const input = UpdateMonthlyGoalTemplateDTO.parse(req.body);
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
      throw new InvalidEntityError('MonthlyGoalTemplate', 'Template ID is required');
    }
    if (!schoolId) {
      throw new InvalidEntityError('School', 'School ID is required');
    }
    validateCuid(templateId, 'MonthlyGoalTemplate');
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

  async getProjectionMonthlyGoalsHandler(req: Request, res: Response): Promise<Response> {
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

    const result = await this.getProjectionMonthlyGoals.execute(projectionId, schoolId);

    if (!result.success) {
      throw result.error;
    }

    return res.status(200).json(result.data);
  }

  async updateGradeHandler(req: Request, res: Response): Promise<Response> {
    const projectionId = req.params.projectionId;
    const monthlyGoalId = req.params.monthlyGoalId;
    const schoolId = req.schoolId;
    if (!projectionId) {
      throw new InvalidEntityError('Projection', 'Projection ID is required');
    }
    if (!monthlyGoalId) {
      throw new InvalidEntityError('ProjectionMonthlyGoal', 'Monthly goal ID is required');
    }
    if (!schoolId) {
      throw new InvalidEntityError('School', 'School ID is required');
    }
    validateCuid(projectionId, 'Projection');
    validateCuid(monthlyGoalId, 'ProjectionMonthlyGoal');
    validateCuid(schoolId, 'School');

    const input = UpdateMonthlyGoalGradeDTO.parse(req.body);
    const result = await this.updateGrade.execute(projectionId, schoolId, monthlyGoalId, input);

    if (!result.success) {
      throw result.error;
    }

    return res.status(200).json(result.data);
  }

  async markUngradedHandler(req: Request, res: Response): Promise<Response> {
    const projectionId = req.params.projectionId;
    const monthlyGoalId = req.params.monthlyGoalId;
    const schoolId = req.schoolId;
    if (!projectionId) {
      throw new InvalidEntityError('Projection', 'Projection ID is required');
    }
    if (!monthlyGoalId) {
      throw new InvalidEntityError('ProjectionMonthlyGoal', 'Monthly goal ID is required');
    }
    if (!schoolId) {
      throw new InvalidEntityError('School', 'School ID is required');
    }
    validateCuid(projectionId, 'Projection');
    validateCuid(monthlyGoalId, 'ProjectionMonthlyGoal');
    validateCuid(schoolId, 'School');

    const result = await this.markUngraded.execute(projectionId, schoolId, monthlyGoalId);

    if (!result.success) {
      throw result.error;
    }

    return res.status(200).json(result.data);
  }
}
