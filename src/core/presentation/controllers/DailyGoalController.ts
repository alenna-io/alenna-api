import { Request, Response } from 'express';
import { container } from '../../infrastructure/frameworks/di/container';
import { GetDailyGoalsInputSchema } from '../../application/dtos/daily-goals/GetDailyGoalsInput';
import { CreateDailyGoalInputSchema } from '../../application/dtos/daily-goals/CreateDailyGoalInput';
import { AddNoteInputSchema } from '../../application/dtos/daily-goals/AddNoteInput';
import { MarkCompleteInputSchema } from '../../application/dtos/daily-goals/MarkCompleteInput';
import { GetDailyGoalsUseCase } from '../../application/use-cases/daily-goals/GetDailyGoalsUseCase';
import { CreateDailyGoalUseCase } from '../../application/use-cases/daily-goals/CreateDailyGoalUseCase';
import { AddNoteToDailyGoalUseCase } from '../../application/use-cases/daily-goals/AddNoteToDailyGoalUseCase';
import { MarkDailyGoalCompleteUseCase } from '../../application/use-cases/daily-goals/MarkDailyGoalCompleteUseCase';
import { InvalidEntityError } from '../../domain/errors';
import { validateCuid } from '../../domain/utils/validation';

export class DailyGoalController {
  constructor(
    private readonly getDailyGoals: GetDailyGoalsUseCase = container.useCase.getDailyGoalsUseCase,
    private readonly createDailyGoal: CreateDailyGoalUseCase = container.useCase.createDailyGoalUseCase,
    private readonly addNote: AddNoteToDailyGoalUseCase = container.useCase.addNoteToDailyGoalUseCase,
    private readonly markComplete: MarkDailyGoalCompleteUseCase = container.useCase.markDailyGoalCompleteUseCase
  ) { }

  async getDailyGoalsHandler(req: Request, res: Response): Promise<Response> {
    const { projectionId, quarter, week } = req.query;

    if (!projectionId || typeof projectionId !== 'string') {
      throw new InvalidEntityError('Query', 'Projection ID query parameter is required');
    }

    validateCuid(projectionId, 'Projection');

    if (!quarter || typeof quarter !== 'string') {
      throw new InvalidEntityError('Query', 'Quarter query parameter is required');
    }

    if (!week || isNaN(Number(week))) {
      throw new InvalidEntityError('Query', 'Week query parameter is required and must be a number');
    }

    const schoolId = req.schoolId;
    if (!schoolId) {
      throw new InvalidEntityError('School', 'School ID is required');
    }
    validateCuid(schoolId, 'School');

    const input = GetDailyGoalsInputSchema.parse({
      quarter,
      week: parseInt(week as string, 10),
    });

    const result = await this.getDailyGoals.execute(projectionId, schoolId, input);

    if (!result.success) {
      throw result.error;
    }

    return res.status(200).json(result.data);
  }

  async createDailyGoalHandler(req: Request, res: Response): Promise<Response> {
    const { projectionId, quarter, week } = req.query;

    if (!projectionId || typeof projectionId !== 'string') {
      throw new InvalidEntityError('Query', 'Projection ID query parameter is required');
    }

    validateCuid(projectionId, 'Projection');

    if (!quarter || typeof quarter !== 'string') {
      throw new InvalidEntityError('Query', 'Quarter query parameter is required');
    }

    if (!week || isNaN(Number(week))) {
      throw new InvalidEntityError('Query', 'Week query parameter is required and must be a number');
    }

    const schoolId = req.schoolId;
    if (!schoolId) {
      throw new InvalidEntityError('School', 'School ID is required');
    }
    validateCuid(schoolId, 'School');

    const input = CreateDailyGoalInputSchema.parse({
      ...req.body,
      quarter,
      week: parseInt(week as string, 10),
    });

    const result = await this.createDailyGoal.execute(projectionId, schoolId, input);

    if (!result.success) {
      throw result.error;
    }

    return res.status(201).json(result.data);
  }

  async addNoteHandler(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!id) {
      throw new InvalidEntityError('Params', 'Daily goal ID parameter is required');
    }

    const schoolId = req.schoolId;
    if (!schoolId) {
      throw new InvalidEntityError('School', 'School ID is required');
    }
    validateCuid(id, 'DailyGoal');
    validateCuid(schoolId, 'School');

    const input = AddNoteInputSchema.parse(req.body);

    const result = await this.addNote.execute(id, schoolId, input);

    if (!result.success) {
      throw result.error;
    }

    return res.status(200).json(result.data);
  }

  async markCompleteHandler(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!id) {
      throw new InvalidEntityError('Params', 'Daily goal ID parameter is required');
    }

    const schoolId = req.schoolId;
    if (!schoolId) {
      throw new InvalidEntityError('School', 'School ID is required');
    }
    validateCuid(id, 'DailyGoal');
    validateCuid(schoolId, 'School');

    const input = MarkCompleteInputSchema.parse(req.body);

    const result = await this.markComplete.execute(id, schoolId, input);

    if (!result.success) {
      throw result.error;
    }

    return res.status(200).json(result.data);
  }
}
