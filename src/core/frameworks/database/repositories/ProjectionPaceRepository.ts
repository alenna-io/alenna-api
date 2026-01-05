import { IProjectionPaceRepository } from '../../../adapters_interface/repositories';
import { ProjectionPace } from '../../../domain/entities';
import { ProjectionPaceMapper } from '../mappers';
import prisma from '../prisma.client';

export class ProjectionPaceRepository implements IProjectionPaceRepository {
  async findById(id: string): Promise<ProjectionPace | null> {
    const projectionPace = await prisma.projectionPace.findUnique({
      where: { id },
    });
    return projectionPace ? ProjectionPaceMapper.toDomain(projectionPace) : null;
  }


  async findByProjectionId(projectionId: string): Promise<ProjectionPace[]> {
    const projectionPaces = await prisma.projectionPace.findMany({
      where: {
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
    return projectionPaces.map(pp => ProjectionPaceMapper.toDomain(pp, pp.paceCatalog));
  }


  async create(projectionPace: ProjectionPace): Promise<ProjectionPace> {
    const created = await prisma.projectionPace.create({
      data: ProjectionPaceMapper.toPrisma(projectionPace),
    });
    return ProjectionPaceMapper.toDomain(created);
  }


  async update(id: string, projectionPace: Partial<ProjectionPace>): Promise<ProjectionPace> {
    const updated = await prisma.projectionPace.update({
      where: { id },
      data: ProjectionPaceMapper.toPrismaUpdate(projectionPace),
    });
    return ProjectionPaceMapper.toDomain(updated);
  }


  async delete(id: string): Promise<void> {
    await prisma.projectionPace.delete({
      where: { id },
    });
  }
}
