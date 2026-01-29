import { IProjectionRepository } from '../../../domain/interfaces/repositories';
import { InvalidEntityError, DomainError } from '../../../domain/errors';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import { GetProjectionListOutput } from '../../dtos/projections/GetProjectionListOutput';

export class GetProjectionListUseCase {
  constructor(
    private readonly projectionRepository: IProjectionRepository,
  ) { }

  async execute(schoolId: string, schoolYear?: string): Promise<Result<GetProjectionListOutput[], DomainError>> {
    try {
      validateCuid(schoolId, 'School');

      const projections = await this.projectionRepository.findManyBySchoolId(schoolId, schoolYear);

      const output: GetProjectionListOutput[] = projections.map(projection => ({
        id: projection.id,
        studentId: projection.studentId,
        schoolYear: projection.schoolYear,
        status: projection.status,
        totalPaces: projection._count.projectionPaces,
        student: {
          id: projection.student.id,
          firstName: projection.student.user?.firstName || null,
          lastName: projection.student.user?.lastName || null,
        },
        createdAt: projection.createdAt.toISOString(),
        updatedAt: projection.updatedAt.toISOString(),
      }));

      return Ok(output);
    } catch (error) {
      if (error instanceof InvalidEntityError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}
