import { Request, Response } from 'express';
import { container } from '../../infrastructure/frameworks/di/container';
import {
  CreateProjectionDTO,
  GenerateProjectionDTO
} from '../../application/dtos/projections';
import {
  CreateProjectionUseCase,
  GenerateProjectionUseCase
} from '../../application/use-cases/projections';

export class ProjectionController {
  constructor(
    private readonly createProjection: CreateProjectionUseCase = container.useCase.createProjectionUseCase,
    private readonly generateProjection: GenerateProjectionUseCase = container.useCase.generateProjectionUseCase
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
}
