import { Request, Response } from 'express';
import { container } from '../../infrastructure/frameworks/di/container';
import { IPaceCatalogRepository } from '../../domain/interfaces/repositories';

export class PaceCatalogController {
  constructor(
    private readonly paceCatalogRepository: IPaceCatalogRepository = container.repository.paceCatalogRepository
  ) { }

  async get(req: Request, res: Response): Promise<Response> {
    const category = req.query.category as string | undefined;

    if (!category) {
      return res.status(400).json({ error: 'Category parameter is required' });
    }

    const paces = await this.paceCatalogRepository.findByCategory(category);

    const result = paces.map(pace => ({
      id: pace.id,
      code: pace.code,
      name: pace.name,
      subSubjectName: pace.subject.name,
      categoryName: pace.subject.category.name,
      levelId: pace.subject.level?.name || 'Electives',
      difficulty: pace.subject.difficulty || 0,
    }));

    return res.status(200).json(result);
  }
}
