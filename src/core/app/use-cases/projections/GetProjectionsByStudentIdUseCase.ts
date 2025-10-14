import { IProjectionRepository } from '../../../adapters_interface/repositories';
import { Projection } from '../../../domain/entities';

export class GetProjectionsByStudentIdUseCase {
  constructor(private projectionRepository: IProjectionRepository) {}

  async execute(studentId: string): Promise<Projection[]> {
    return await this.projectionRepository.findByStudentId(studentId);
  }
}

