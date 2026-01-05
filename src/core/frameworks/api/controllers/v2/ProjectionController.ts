import { CreateProjectionDTO } from '../../../../app/dtos/v2/projections/CreateProjectionInput';
import { CreateProjectionUseCase } from '../../../../app/use-cases/projections/v2/CreateProjectionUseCase';
import { NextFunction, Request, Response } from 'express';
import { container } from '../../../di/v2/container';

export class ProjectionController {
  constructor(
    private readonly createProjection: CreateProjectionUseCase = container.useCase.createProjectionUseCase
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
}