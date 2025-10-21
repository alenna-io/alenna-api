import { IProjectionRepository } from '../../../adapters_interface/repositories';
import prisma from '../../../frameworks/database/prisma.client';

export class RemovePaceFromProjectionUseCase {
  constructor(private projectionRepository: IProjectionRepository) {}

  async execute(
    projectionId: string,
    projectionPaceId: string,
    studentId: string
  ): Promise<void> {
    // 1. Verify projection exists and belongs to student
    const projection = await this.projectionRepository.findById(projectionId, studentId);
    if (!projection) {
      throw new Error('Proyección no encontrada');
    }

    // 2. Verify projection pace exists and belongs to this projection
    const projectionPace = await prisma.projectionPace.findFirst({
      where: {
        id: projectionPaceId,
        projectionId,
        deletedAt: null,
      },
    });

    if (!projectionPace) {
      throw new Error('PACE no encontrado en la proyección');
    }

    // 3. Soft delete the projection pace
    await prisma.projectionPace.update({
      where: { id: projectionPaceId },
      data: { deletedAt: new Date() },
    });
  }
}

