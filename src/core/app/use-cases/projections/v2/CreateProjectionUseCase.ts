import { ProjectionRepository } from '../../../../adapters_interface/repositories/v2/ProjectionRepository';
import { ObjectAlreadyExistsError } from '../../../errors/v2/ObjectAlreadyExistsError';

export class CreateProjectionUseCase {
  constructor(
    private readonly projections: ProjectionRepository
  ) { }

  async execute(input: {
    studentId: string;
    schoolId: string;
    schoolYear: string;
  }) {
    const existing =
      await this.projections.findActiveByStudent(
        input.studentId,
        input.schoolId,
        input.schoolYear
      );

    if (existing) {
      throw new ObjectAlreadyExistsError('Projection', 'A projection already exists for this student in this school year.');
    }
    return this.projections.create(input);
  }
}
