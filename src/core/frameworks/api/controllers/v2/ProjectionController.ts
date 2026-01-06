import { CreateProjectionDTO } from '../../../../app/dtos/v2/projections/CreateProjectionInput';
import { CreateProjectionUseCase } from '../../../../app/use-cases/projections/v2/CreateProjectionUseCase';
import { NextFunction, Request, Response } from 'express';
import { container } from '../../../di/v2/container';
import { GenerateProjectionDTO } from '../../../../app/dtos/v2/projections/GenerateProjectionInput';
import { GenerateProjectionUseCase } from '../../../../app/use-cases/projections/v2/GenerateProjectionUseCase';

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