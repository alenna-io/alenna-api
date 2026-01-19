import { ISchoolRepository, IStudentRepository } from '../../../domain/interfaces/repositories';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import {
  DomainError,
  InvalidEntityError,
  ObjectAlreadyExistsError,
  ObjectNotFoundError,
} from '../../../domain/errors';
import { Prisma } from '@prisma/client';

export class GetEnrolledWithoutOpenProjectionUseCase {
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly schoolRepository: ISchoolRepository
  ) { }

  async execute(userId: string): Promise<Result<Prisma.StudentGetPayload<{}>[], DomainError>> {
    try {
      const school = await this.schoolRepository.findSchoolWithCurrentYearByUserId(userId);

      if (!school) {
        return Err(new ObjectNotFoundError('School', 'School not found for this user'));
      }

      const students = await this.studentRepository.findEnrolledWithoutOpenProjectionBySchoolId(school.id);
      return Ok(students);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectAlreadyExistsError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}