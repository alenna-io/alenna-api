import { ISchoolRepository } from '../../../domain/interfaces/repositories';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import {
  DomainError,
  InvalidEntityError,
  ObjectAlreadyExistsError,
  ObjectNotFoundError,
} from '../../../domain/errors';
import { Prisma } from '@prisma/client';

export class GetSchoolWithCurrentYearByUserIdUseCase {
  constructor(
    private readonly schoolRepository: ISchoolRepository
  ) { }

  async execute(userId: string): Promise<Result<Prisma.SchoolGetPayload<{}> | null, DomainError>> {
    try {
      const school = await this.schoolRepository.findSchoolWithCurrentYearByUserId(userId);
      return Ok(school as Prisma.SchoolGetPayload<{ include: { schoolYears: true } }> | null);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectAlreadyExistsError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}