import { CreateProjectionDTO } from '../../application/dtos/projections/CreateProjectionInput';
import { CreateProjectionUseCase } from '../../application/use-cases/projections/CreateProjectionUseCase';
import { NextFunction, Request, Response } from 'express';
import { container } from '../../infrastructure/frameworks/di/container';
import { GenerateProjectionDTO } from '../../application/dtos/projections/GenerateProjectionInput';
import { GenerateProjectionUseCase } from '../../application/use-cases/projections/GenerateProjectionUseCase';

export class ProjectionController {
  constructor(
    private readonly createProjection: CreateProjectionUseCase = container.useCase.createProjectionUseCase,
    private readonly generateProjection: GenerateProjectionUseCase = container.useCase.generateProjectionUseCase
  ) { }

  async create(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const input = CreateProjectionDTO.parse(req.body);

      const projection =
        await this.createProjection.execute({
          ...input,
        });

      return res.status(201).json(projection);
    } catch (err: any) {
      console.error('Error creating projection:', err);

      next(err)
    }
  }

  async generate(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const input = GenerateProjectionDTO.parse(req.body);

      const projection =
        await this.generateProjection.execute({
          ...input,
        });

      return res.status(201).json(projection);
    } catch (err: any) {
      console.error('Error generating projection:', err);
      next(err)
    }
  }
}
