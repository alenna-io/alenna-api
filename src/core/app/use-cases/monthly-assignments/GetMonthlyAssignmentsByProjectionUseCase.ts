import prisma from '../../../frameworks/database/prisma.client';
import { MonthlyAssignmentOutput, MonthlyAssignmentGradeHistoryOutput } from '../../dtos';

export class GetMonthlyAssignmentsByProjectionUseCase {
  async execute(
    projectionId: string,
    studentId: string
  ): Promise<MonthlyAssignmentOutput[]> {
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

    // 2. Get all assignments for this projection
    const assignments = await prisma.monthlyAssignment.findMany({
      where: {
        projectionId,
        deletedAt: null,
      },
      include: {
        gradeHistory: {
          orderBy: {
            date: 'asc',
          },
        },
      },
      orderBy: [
        { quarter: 'asc' },
        { name: 'asc' },
      ],
    });

    // 3. Map to output DTO
    return assignments.map(assignment => ({
      id: assignment.id,
      name: assignment.name,
      quarter: assignment.quarter,
      grade: assignment.grade,
      gradeHistory: assignment.gradeHistory.map(gh => ({
        id: gh.id,
        grade: gh.grade,
        date: gh.date.toISOString(),
        note: gh.note ?? undefined,
      })),
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString(),
    }));
  }
}

