import { IProjectionRepository } from '../../../adapters_interface/repositories';
import { ProjectionPace } from '../../../domain/entities';
import prisma from '../../../frameworks/database/prisma.client';
import { randomUUID } from 'crypto';
import { ProjectionPaceMapper } from '../../../frameworks/database/mappers';

export class UpdatePaceGradeUseCase {
  constructor(private projectionRepository: IProjectionRepository) {}

  async execute(
    projectionId: string,
    projectionPaceId: string,
    studentId: string,
    grade: number,
    isCompleted?: boolean,
    isFailed?: boolean,
    comments?: string,
    note?: string
  ): Promise<ProjectionPace> {
    // 1. Verify projection exists and belongs to student
    const projection = await this.projectionRepository.findById(projectionId, studentId);
    if (!projection) {
      throw new Error('Proyección no encontrada');
    }

    // 2. Verify projection pace exists and belongs to this projection
    const projectionPace = await prisma.projectionPace.findFirst({
      where: {
        id: projectionPaceId,
        projectionId,
        deletedAt: null,
      },
    });

    if (!projectionPace) {
      throw new Error('PACE no encontrado en la proyección');
    }

    // 2.5. Check if quarter is closed
    const projectionWithStudent = await prisma.projection.findFirst({
      where: {
        id: projectionId,
        deletedAt: null,
      },
      include: {
        student: {
          select: {
            schoolId: true,
          },
        },
      },
    });

    if (projectionWithStudent) {
      const schoolYear = await prisma.schoolYear.findFirst({
        where: {
          schoolId: projectionWithStudent.student.schoolId,
          name: projection.schoolYear,
          deletedAt: null,
        },
      });

      if (schoolYear) {
        const quarter = await prisma.quarter.findFirst({
          where: {
            schoolYearId: schoolYear.id,
            name: projectionPace.quarter,
            deletedAt: null,
          },
        });

        if (quarter?.isClosed) {
          throw new Error('Cannot edit grades for closed quarter');
        }
      }
    }

    // 3. Determine completion status
    const finalIsCompleted = isCompleted ?? (grade >= 80);
    const finalIsFailed = isFailed ?? (grade < 80);

    // 4. Update the projection pace
    const updated = await prisma.projectionPace.update({
      where: { id: projectionPaceId },
      data: {
        grade,
        isCompleted: finalIsCompleted,
        isFailed: finalIsFailed,
        comments: comments ?? projectionPace.comments,
      },
    });

    // 5. Add to grade history if this is a new grade entry
    await prisma.gradeHistory.create({
      data: {
        id: randomUUID(),
        projectionPaceId: projectionPaceId,
        grade,
        date: new Date(),
        note: note ?? undefined,
      },
    });

    return ProjectionPaceMapper.toDomain(updated);
  }
}

