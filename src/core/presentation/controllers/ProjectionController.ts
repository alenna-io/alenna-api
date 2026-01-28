import { Request, Response } from 'express';
import { container } from '../../infrastructure/frameworks/di/container';
import {
  CreateProjectionDTO,
  GenerateProjectionDTO,
  MovePaceDTO,
  AddPaceDTO
} from '../../application/dtos/projections';
import {
  CreateProjectionUseCase,
  GenerateProjectionUseCase,
  GetProjectionListUseCase,
  GetProjectionDetailsUseCase,
  MovePaceUseCase,
  AddPaceUseCase,
  DeletePaceUseCase
} from '../../application/use-cases/projections';
import { InvalidEntityError } from '../../domain/errors';
import { validateCuid } from '../../domain/utils/validation';

export class ProjectionController {
  constructor(
    private readonly createProjection: CreateProjectionUseCase = container.useCase.createProjectionUseCase,
    private readonly generateProjection: GenerateProjectionUseCase = container.useCase.generateProjectionUseCase,
    private readonly getProjectionList: GetProjectionListUseCase = container.useCase.getProjectionListUseCase,
    private readonly getProjectionDetails: GetProjectionDetailsUseCase = container.useCase.getProjectionDetailsUseCase,
    private readonly movePace: MovePaceUseCase = container.useCase.movePaceUseCase,
    private readonly addPace: AddPaceUseCase = container.useCase.addPaceUseCase,
    private readonly deletePace: DeletePaceUseCase = container.useCase.deletePaceUseCase
  ) { }

  async create(req: Request, res: Response): Promise<Response> {
    const input = CreateProjectionDTO.parse(req.body);

    const result = await this.createProjection.execute({
      ...input,
    });

    if (!result.success) {
      throw result.error;
    }

    return res.status(201).json(result.data);
  }

  async generate(req: Request, res: Response): Promise<Response> {
    const input = GenerateProjectionDTO.parse(req.body);

    const result = await this.generateProjection.execute({
      ...input,
    });

    if (!result.success) {
      throw result.error;
    }

    return res.status(201).json(result.data);
  }

  async getList(req: Request, res: Response): Promise<Response> {
    const schoolId = req.schoolId;
    if (!schoolId) {
      throw new InvalidEntityError('School', 'School ID is required');
    }
    validateCuid(schoolId, 'School');

    const schoolYear = req.query.schoolYear as string | undefined;

    const result = await this.getProjectionList.execute(schoolId, schoolYear);
    if (!result.success) {
      throw result.error;
    }

    return res.status(200).json(result.data);
  }

  async getById(req: Request, res: Response): Promise<Response> {
    const projectionId = req.params.id;
    if (!projectionId) {
      throw new InvalidEntityError('Projection', 'Projection ID is required');
    }
    validateCuid(projectionId, 'Projection');

    const result = await this.getProjectionDetails.execute(projectionId);
    if (!result.success) {
      throw result.error;
    }

    return res.status(200).json(result.data);
  }

  async movePaceHandler(req: Request, res: Response): Promise<Response> {
    const projectionId = req.params.id;
    const paceId = req.params.paceId;
    if (!projectionId) {
      throw new InvalidEntityError('Projection', 'Projection ID is required');
    }
    if (!paceId) {
      throw new InvalidEntityError('ProjectionPace', 'Pace ID is required');
    }
    validateCuid(projectionId, 'Projection');
    validateCuid(paceId, 'ProjectionPace');

    const input = MovePaceDTO.parse(req.body);

    const result = await this.movePace.execute(projectionId, paceId, input);
    if (!result.success) {
      throw result.error;
    }

    return res.status(200).json(result.data);
  }

  async addPaceHandler(req: Request, res: Response): Promise<Response> {
    const projectionId = req.params.id;
    if (!projectionId) {
      throw new InvalidEntityError('Projection', 'Projection ID is required');
    }
    validateCuid(projectionId, 'Projection');

    const input = AddPaceDTO.parse(req.body);

    const result = await this.addPace.execute(projectionId, input);
    if (!result.success) {
      throw result.error;
    }

    return res.status(201).json(result.data);
  }

  async deletePaceHandler(req: Request, res: Response): Promise<Response> {
    const projectionId = req.params.id;
    const paceId = req.params.paceId;
    if (!projectionId) {
      throw new InvalidEntityError('Projection', 'Projection ID is required');
    }
    if (!paceId) {
      throw new InvalidEntityError('ProjectionPace', 'Pace ID is required');
    }
    validateCuid(projectionId, 'Projection');
    validateCuid(paceId, 'ProjectionPace');

    const result = await this.deletePace.execute(projectionId, paceId);
    if (!result.success) {
      throw result.error;
    }

    return res.status(204).send();
  }
}
