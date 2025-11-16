import { MonthlyAssignment } from '../../../domain/entities';
import prisma from '../../../frameworks/database/prisma.client';
import { UpdateMonthlyAssignmentInput } from '../../dtos';

export class UpdateMonthlyAssignmentUseCase {
  async execute(
    assignmentId: string,
    input: UpdateMonthlyAssignmentInput,
    studentId: string
  ): Promise<MonthlyAssignment> {
    // 1. Verify assignment exists and belongs to student's projection
    const assignment = await prisma.monthlyAssignment.findFirst({
      where: {
        id: assignmentId,
        deletedAt: null,
        projection: {
          studentId,
          deletedAt: null,
        },
      },
    });

    if (!assignment) {
      throw new Error('Asignación no encontrada');
    }

    // 2. Validate name if provided
    if (input.name !== undefined) {
      if (!input.name || input.name.trim().length === 0) {
        throw new Error('El nombre de la asignación es requerido');
      }
    }

    // 3. Update the assignment
    const updated = await prisma.monthlyAssignment.update({
      where: { id: assignmentId },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        updatedAt: new Date(),
      },
    });

    return new MonthlyAssignment(
      updated.id,
      updated.projectionId,
      updated.name,
      updated.quarter,
      updated.grade,
      updated.createdAt,
      updated.updatedAt,
      updated.deletedAt ?? undefined
    );
  }
}

