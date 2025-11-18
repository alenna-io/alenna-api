import { IProjectionRepository } from '../../../adapters_interface/repositories';

export class DeleteProjectionUseCase {
  constructor(private projectionRepository: IProjectionRepository) {}

  async execute(id: string, studentId: string): Promise<void> {
    // Check if projection is empty (has no paces)
    const projection = await this.projectionRepository.findByIdWithPaces(id, studentId);
    if (!projection) {
      throw new Error('Proyección no encontrada');
    }

    // If projection has paces, throw error
    if (projection.projectionPaces && projection.projectionPaces.length > 0) {
      throw new Error('No se puede eliminar una proyección con lecciones. Por favor, elimina todas las lecciones primero.');
    }

    // If empty, hard delete from DB
    await this.projectionRepository.hardDelete(id, studentId);
  }
}

