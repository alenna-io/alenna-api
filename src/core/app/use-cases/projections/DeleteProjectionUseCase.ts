import { IProjectionRepository } from '../../../adapters_interface/repositories';

export class DeleteProjectionUseCase {
  constructor(private projectionRepository: IProjectionRepository) {}

  async execute(id: string, studentId: string): Promise<void> {
    await this.projectionRepository.delete(id, studentId);
  }
}

