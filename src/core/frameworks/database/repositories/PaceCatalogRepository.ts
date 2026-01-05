import { IPaceCatalogRepository } from '../../../adapters_interface/repositories';
import { PaceCatalog } from '../../../domain/entities';
import { PaceCatalogMapper } from '../mappers';
import { randomUUID } from 'crypto';
import prisma from '../prisma.client';

export class PaceCatalogRepository implements IPaceCatalogRepository {
  async findById(id: string): Promise<PaceCatalog | null> {
    const paceCatalog = await prisma.paceCatalog.findUnique({
      where: { id },
    });
    return paceCatalog ? PaceCatalogMapper.toDomain(paceCatalog) : null;
  }

  async findAllBySubSubjectId(subSubjectId: string): Promise<PaceCatalog[]> {
    const paceCatalogs = await prisma.paceCatalog.findMany({
      where: { subSubjectId },
    });
    return paceCatalogs.map((paceCatalog) => PaceCatalogMapper.toDomain(paceCatalog));
  }

  async createMany(paceCatalogs: PaceCatalog[]): Promise<PaceCatalog[]> {
    const created = await prisma.paceCatalog.createManyAndReturn({
      data: paceCatalogs.map(PaceCatalogMapper.toPrisma),
    });
    return created.map((paceCatalog) => PaceCatalogMapper.toDomain(paceCatalog));
  }

  async create(paceCatalog: PaceCatalog): Promise<PaceCatalog> {
    const created = await prisma.paceCatalog.create({
      data: {
        id: randomUUID(),
        code: paceCatalog.code,
        name: paceCatalog.name,
        subSubjectId: paceCatalog.subSubjectId,
      },
    });
    return PaceCatalogMapper.toDomain(created);
  }

  async update(id: string, paceCatalog: Partial<PaceCatalog>): Promise<PaceCatalog> {
    const updated = await prisma.paceCatalog.update({
      where: { id },
      data: PaceCatalogMapper.toPrismaUpdate(paceCatalog),
    });
    return PaceCatalogMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.paceCatalog.delete({
      where: { id },
    });
  }
}