import { IProjectionRepository } from '../../../adapters_interface/repositories';
import { Projection } from '../../../domain/entities';
import prisma from '../prisma.client';
import { ProjectionMapper } from '../mappers';

export class ProjectionRepository implements IProjectionRepository {
  async findById(id: string, studentId: string): Promise<Projection | null> {
    const projection = await prisma.projection.findFirst({
      where: { 
        id,
        studentId, // Ensure student owns this projection
        deletedAt: null, // Soft delete filter
      },
    });

    return projection ? ProjectionMapper.toDomain(projection) : null;
  }

  async findByStudentId(studentId: string): Promise<Projection[]> {
    const projections = await prisma.projection.findMany({
      where: { 
        studentId,
        deletedAt: null, // Soft delete filter
      },
      orderBy: { createdAt: 'desc' },
    });

    return projections.map(ProjectionMapper.toDomain);
  }

  async findActiveByStudentId(studentId: string): Promise<Projection | null> {
    const projection = await prisma.projection.findFirst({
      where: { 
        studentId,
        isActive: true,
        deletedAt: null, // Soft delete filter
      },
    });

    return projection ? ProjectionMapper.toDomain(projection) : null;
  }

  async create(projection: Projection): Promise<Projection> {
    const created = await prisma.projection.create({
      data: {
        studentId: projection.studentId,
        schoolYear: projection.schoolYear,
        startDate: projection.startDate,
        endDate: projection.endDate,
        isActive: projection.isActive,
        notes: projection.notes || null,
      },
    });

    return ProjectionMapper.toDomain(created);
  }

  async update(id: string, data: Partial<Projection>, studentId: string): Promise<Projection> {
    // First check if projection exists and belongs to student
    const existing = await this.findById(id, studentId);
    if (!existing) {
      throw new Error('Projection not found');
    }

    const updated = await prisma.projection.update({
      where: { id },
      data: {
        schoolYear: data.schoolYear,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive,
        notes: data.notes || undefined,
      },
    });

    return ProjectionMapper.toDomain(updated);
  }

  async delete(id: string, studentId: string): Promise<void> {
    // First check if projection exists and belongs to student
    const existing = await this.findById(id, studentId);
    if (!existing) {
      throw new Error('Projection not found');
    }

    // Soft delete
    await prisma.projection.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

