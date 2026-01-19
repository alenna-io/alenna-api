import { Request, Response } from 'express';
import { container } from '../../infrastructure/frameworks/di/container';
import { GetCategoriesWithSubjectsUseCase } from '../../application/use-cases/categories/GetCategoriesWithSubjectsUseCase';

export class CategoryController {
  constructor(
    private readonly getCategoriesWithSubjectsUseCase: GetCategoriesWithSubjectsUseCase = container.useCase.getCategoriesWithSubjectsUseCase
  ) { }

  async getCategoriesWithSubjects(_: Request, res: Response): Promise<Response> {
    const result = await this.getCategoriesWithSubjectsUseCase.execute();
    if (!result.success) {
      throw result.error;
    }
    return res.status(200).json(result.data);
  }
}