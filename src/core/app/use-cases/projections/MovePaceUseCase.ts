import { IProjectionRepository } from '../../../adapters_interface/repositories';
import { ProjectionPace } from '../../../domain/entities';
import prisma from '../../../frameworks/database/prisma.client';
import { ProjectionPaceMapper } from '../../../frameworks/database/mappers';

export class MovePaceUseCase {
  constructor(private projectionRepository: IProjectionRepository) {}

  async execute(
    projectionId: string,
    projectionPaceId: string,
    studentId: string,
    newQuarter: string,
    newWeek: number
  ): Promise<ProjectionPace> {
    // 1. Verify projection exists and belongs to student
    const projection = await this.projectionRepository.findById(projectionId, studentId);
    if (!projection) {
      throw new Error('Proyección no encontrada');
    }

    // 2. Get the projection pace to move
    const projectionPace = await prisma.projectionPace.findFirst({
      where: {
        id: projectionPaceId,
        projectionId,
        deletedAt: null,
      },
      include: {
        paceCatalog: {
          include: {
            subSubject: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!projectionPace) {
      throw new Error('PACE no encontrado en la proyección');
    }

    const categoryName = projectionPace.paceCatalog.subSubject.category.name;

    // 3. Check if there's already a PACE at the target position in the same category
    const existingAtPosition = await prisma.projectionPace.findFirst({
      where: {
        projectionId,
        quarter: newQuarter,
        week: newWeek,
        id: { not: projectionPaceId }, // Exclude the pace we're moving
        paceCatalog: {
          subSubject: {
            category: {
              name: categoryName,
            },
          },
        },
        deletedAt: null,
      },
    });

    if (existingAtPosition) {
      throw new Error(`Ya existe un PACE de ${categoryName} en ${newQuarter} Semana ${newWeek}`);
    }

    // 4. Update the pace position
    const updated = await prisma.projectionPace.update({
      where: { id: projectionPaceId },
      data: {
        quarter: newQuarter,
        week: newWeek,
      },
    });

    return ProjectionPaceMapper.toDomain(updated);
  }
}

