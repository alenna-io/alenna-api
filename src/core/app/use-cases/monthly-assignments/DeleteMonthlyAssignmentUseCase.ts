import prisma from '../../../frameworks/database/prisma.client';

export class DeleteMonthlyAssignmentUseCase {
  async execute(
    assignmentId: string,
    studentId: string
  ): Promise<void> {
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

    // 2. Soft delete the assignment
    await prisma.monthlyAssignment.update({
      where: { id: assignmentId },
      data: { deletedAt: new Date() },
    });
  }
}

