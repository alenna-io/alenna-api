import { IProjectionRepository } from '../../../adapters_interface/repositories';
import { ProjectionPace } from '../../../domain/entities';
import prisma from '../../../frameworks/database/prisma.client';
import { ProjectionPaceMapper } from '../../../frameworks/database/mappers';

export class MovePaceUseCase {
  constructor(private projectionRepository: IProjectionRepository) { }

  async execute(
    projectionId: string,
    projectionPaceId: string,
    studentId: string,
    newQuarter: string,
    newWeek: number
  ): Promise<ProjectionPace> {
    // 1. Verify projection exists and belongs to student
    const projection = await this.projectionRepository.findById(projectionId, studentId);
    if (!projection) {
      throw new Error('Proyección no encontrada');
    }

    // 2. Get the projection pace to move
    const projectionPace = await prisma.projectionPace.findFirst({
      where: {
        id: projectionPaceId,
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

    if (!projectionPace) {
      throw new Error('PACE no encontrado en la proyección');
    }

    // 2.5. Check if source or target quarter is closed
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
        const sourceQuarter = await prisma.quarter.findFirst({
          where: {
            schoolYearId: schoolYear.id,
            name: projectionPace.quarter,
            deletedAt: null,
          },
        });

        if (sourceQuarter?.isClosed) {
          throw new Error('Cannot move paces from closed quarter');
        }

        const targetQuarter = await prisma.quarter.findFirst({
          where: {
            schoolYearId: schoolYear.id,
            name: newQuarter,
            deletedAt: null,
          },
        });

        if (targetQuarter?.isClosed) {
          throw new Error('Cannot move paces to closed quarter');
        }
      }
    }

    const categoryName = projectionPace.paceCatalog.subSubject.category.name;

    // 3. Check if there's already a PACE at the target position in the same category
    const existingAtPosition = await prisma.projectionPace.findFirst({
      where: {
        projectionId,
        quarter: newQuarter,
        week: newWeek,
        id: { not: projectionPaceId }, // Exclude the pace we're moving
        paceCatalog: {
          subSubject: {
            category: {
              name: categoryName,
            },
          },
        },
        deletedAt: null,
      },
    });

    if (existingAtPosition) {
      throw new Error(`Ya existe un PACE de ${categoryName} en ${newQuarter} Semana ${newWeek}`);
    }

    // 3.5. Validate sequential order - ensure pace numbers are in order within the same subject
    const currentPaceNumber = parseInt(projectionPace.paceCatalog.code) || 0;
    const subjectName = projectionPace.paceCatalog.subSubject.name;

    // Get all paces in the target quarter for the same subject (excluding the one we're moving)
    const targetQuarterPaces = await prisma.projectionPace.findMany({
      where: {
        projectionId,
        quarter: newQuarter,
        id: { not: projectionPaceId }, // Exclude the pace we're moving
        deletedAt: null,
        paceCatalog: {
          subSubject: {
            name: subjectName,
          },
        },
      },
      include: {
        paceCatalog: true,
      },
    });

    // Sort by pace number
    targetQuarterPaces.sort((a, b) => {
      const paceNumA = parseInt(a.paceCatalog.code) || 0;
      const paceNumB = parseInt(b.paceCatalog.code) || 0;
      return paceNumA - paceNumB;
    });

    // Check if inserting this pace would create a gap in sequential order
    // Find the pace that should come before and after this pace number
    let beforePace: typeof targetQuarterPaces[0] | null = null;
    let afterPace: typeof targetQuarterPaces[0] | null = null;

    for (const pace of targetQuarterPaces) {
      const paceNum = parseInt(pace.paceCatalog.code) || 0;
      if (paceNum < currentPaceNumber) {
        beforePace = pace;
      } else if (paceNum > currentPaceNumber && !afterPace) {
        afterPace = pace;
        break;
      }
    }

    // If there's a pace before and after, check if they're sequential (no gap)
    if (beforePace && afterPace) {
      const beforeNum = parseInt(beforePace.paceCatalog.code) || 0;
      const afterNum = parseInt(afterPace.paceCatalog.code) || 0;

      // If before and after are consecutive (e.g., 1067 and 1068), we can't insert 1066 between them
      if (afterNum - beforeNum === 1) {
        throw new Error(`No se puede insertar el PACE ${currentPaceNumber} entre ${beforeNum} y ${afterNum}. Los PACEs deben estar en orden secuencial sin espacios.`);
      }
    }

    // 4. Update the pace position
    const updated = await prisma.projectionPace.update({
      where: { id: projectionPaceId },
      data: {
        quarter: newQuarter,
        week: newWeek,
      },
    });

    return ProjectionPaceMapper.toDomain(updated);
  }
}

