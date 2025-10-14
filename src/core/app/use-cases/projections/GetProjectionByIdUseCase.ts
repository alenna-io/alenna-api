import { IProjectionRepository } from '../../../adapters_interface/repositories';
import { Projection } from '../../../domain/entities';

export class GetProjectionByIdUseCase {
  constructor(private projectionRepository: IProjectionRepository) {}

  async execute(id: string, studentId: string): Promise<Projection> {
    const projection = await this.projectionRepository.findById(id, studentId);
    
    if (!projection) {
      throw new Error('Projection not found');
    }

    return projection;
  }
}

