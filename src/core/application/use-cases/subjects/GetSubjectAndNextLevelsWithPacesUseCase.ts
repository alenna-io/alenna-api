import { ISubjectRepository } from '../../../domain/interfaces/repositories';
import { Prisma } from '@prisma/client';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import {
  DomainError,
  InvalidEntityError,
  ObjectAlreadyExistsError,
  ObjectNotFoundError
} from '../../../domain/errors';

export class GetSubjectAndNextLevelsWithPacesUseCase {
  constructor(
    private readonly subjectRepository: ISubjectRepository
  ) { }

  async execute(subjectId: string): Promise<Result<Prisma.SubjectGetPayload<{ include: { paces: true; level: true } }>[], DomainError>> {
    try {
      const nextLevelsCount = 2; // Current + Next 2 levels
      const subjects = await this.subjectRepository.findBySubjectAndNextLevelsWithPaces(subjectId, nextLevelsCount);
      return Ok(subjects as Prisma.SubjectGetPayload<{ include: { paces: true; level: true } }>[]);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectAlreadyExistsError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}