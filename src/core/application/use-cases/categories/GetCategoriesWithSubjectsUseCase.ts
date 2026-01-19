import { ICategoryRepository } from '../../../domain/interfaces/repositories';
import { Prisma } from '@prisma/client';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import {
  DomainError,
  InvalidEntityError,
  ObjectAlreadyExistsError,
  ObjectNotFoundError
} from '../../../domain/errors';

export class GetCategoriesWithSubjectsUseCase {
  constructor(
    private readonly categoryRepository: ICategoryRepository
  ) { }

  async execute(): Promise<Result<Prisma.CategoryGetPayload<{ include: { subjects: true } }>[], DomainError>> {
    try {
      const categories = await this.categoryRepository.findAllWithSubjects();
      return Ok(categories as Prisma.CategoryGetPayload<{ include: { subjects: true } }>[]);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectAlreadyExistsError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}
