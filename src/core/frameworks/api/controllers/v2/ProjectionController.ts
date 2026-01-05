import { CreateProjectionDTO } from '../../../../app/dtos/v2/projections/CreateProjectionInput';
import { CreateProjectionUseCase } from '../../../../app/use-cases/projections/v2/CreateProjectionUseCase';
import { NextFunction, Request, Response } from 'express';

export class ProjectionController {
  constructor(
    private readonly createProjection: CreateProjectionUseCase
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