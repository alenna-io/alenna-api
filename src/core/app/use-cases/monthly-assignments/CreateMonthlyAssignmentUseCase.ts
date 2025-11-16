import { MonthlyAssignment } from '../../../domain/entities';
import prisma from '../../../frameworks/database/prisma.client';
import { randomUUID } from 'crypto';
import { CreateMonthlyAssignmentInput } from '../../dtos';

export class CreateMonthlyAssignmentUseCase {
  async execute(
    projectionId: string,
    input: CreateMonthlyAssignmentInput,
    studentId: string
  ): Promise<MonthlyAssignment> {
    // 1. Verify projection exists and belongs to student
    const projection = await prisma.projection.findFirst({
      where: {
        id: projectionId,
        studentId,
        deletedAt: null,
      },
    });

    if (!projection) {
      throw new Error('Proyección no encontrada');
    }

    // 2. Validate quarter
    if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(input.quarter)) {
      throw new Error('Trimestre inválido');
    }

    // 3. Validate name
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('El nombre de la asignación es requerido');
    }

    // 4. Create the assignment
    const assignment = await prisma.monthlyAssignment.create({
      data: {
        id: randomUUID(),
        projectionId,
        name: input.name.trim(),
        quarter: input.quarter,
        grade: null,
      },
    });

    return new MonthlyAssignment(
      assignment.id,
      assignment.projectionId,
      assignment.name,
      assignment.quarter,
      assignment.grade,
      assignment.createdAt,
      assignment.updatedAt,
      assignment.deletedAt ?? undefined
    );
  }
}

