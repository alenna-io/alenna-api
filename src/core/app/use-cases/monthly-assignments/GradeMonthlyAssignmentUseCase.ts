import { MonthlyAssignment } from '../../../domain/entities';
import prisma from '../../../frameworks/database/prisma.client';
import { GradeMonthlyAssignmentInput } from '../../dtos';
import { randomUUID } from 'crypto';

export class GradeMonthlyAssignmentUseCase {
  async execute(
    assignmentId: string,
    input: GradeMonthlyAssignmentInput,
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

    // 2. Validate grade
    if (input.grade < 0 || input.grade > 100) {
      throw new Error('La calificación debe estar entre 0 y 100');
    }

    // 3. Add to grade history
    await prisma.monthlyAssignmentGradeHistory.create({
      data: {
        id: randomUUID(),
        monthlyAssignmentId: assignmentId,
        grade: input.grade,
        date: new Date(),
        note: input.note,
      },
    });

    // 4. Update the assignment's current grade
    const updated = await prisma.monthlyAssignment.update({
      where: { id: assignmentId },
      data: {
        grade: input.grade,
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

