import { PrismaCategoryRepository } from "../../repositories";
import { Prisma } from '@prisma/client';

export class GetCategoriesWithSubjectsUseCase {
  constructor(
    private readonly categoryRepository: PrismaCategoryRepository
  ) { }

  async execute(): Promise<Prisma.CategoryGetPayload<{ include: { subjects: true } }>[]> {
    return this.categoryRepository.findAllWithSubjects();
  }
}
