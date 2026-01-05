import { IMonthlyAssignmentsRepository } from '../../../adapters_interface/repositories';
import { MonthlyAssignment } from '../../../domain/entities';
import { MonthlyAssignmentMapper } from '../mappers';
import prisma from '../prisma.client';

export class MonthlyAssignmentsRepository implements IMonthlyAssignmentsRepository {
  async findById(id: string): Promise<MonthlyAssignment | null> {
    const monthlyAssignment = await prisma.monthlyAssignment.findUnique({
      where: { id },
    });
    return monthlyAssignment ? MonthlyAssignmentMapper.toDomain(monthlyAssignment) : null;
  }

  async findByProjectionId(projectionId: string): Promise<MonthlyAssignment[]> {
    const monthlyAssignments = await prisma.monthlyAssignment.findMany({
      where: {
        projectionId,
        deletedAt: null,
      },
      orderBy: [
        { quarter: 'asc' },
        { name: 'asc' },
      ],
    });
    return monthlyAssignments.map(MonthlyAssignmentMapper.toDomain);
  }

  async create(monthlyAssignment: MonthlyAssignment): Promise<MonthlyAssignment> {
    const created = await prisma.monthlyAssignment.create({
      data: MonthlyAssignmentMapper.toPrisma(monthlyAssignment),
    });
    return MonthlyAssignmentMapper.toDomain(created);
  }

  async update(id: string, monthlyAssignment: Partial<MonthlyAssignment>): Promise<MonthlyAssignment> {
    const updated = await prisma.monthlyAssignment.update({
      where: { id },
      data: MonthlyAssignmentMapper.toPrismaUpdate(monthlyAssignment),
    });
    return MonthlyAssignmentMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.monthlyAssignment.delete({
      where: { id },
    });
  }
}
