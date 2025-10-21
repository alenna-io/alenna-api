import { IProjectionRepository } from '../../../adapters_interface/repositories';
import { ProjectionPace } from '../../../domain/entities';
import prisma from '../../../frameworks/database/prisma.client';
import { ProjectionPaceMapper } from '../../../frameworks/database/mappers';

export class MarkPaceIncompleteUseCase {
  constructor(private projectionRepository: IProjectionRepository) {}

  async execute(
    projectionId: string,
    projectionPaceId: string,
    studentId: string
  ): Promise<ProjectionPace> {
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

    // 3. Mark as incomplete (reset grade, completion status)
    const updated = await prisma.projectionPace.update({
      where: { id: projectionPaceId },
      data: {
        grade: null,
        isCompleted: false,
        isFailed: false,
        comments: null,
      },
    });

    return ProjectionPaceMapper.toDomain(updated);
  }
}

