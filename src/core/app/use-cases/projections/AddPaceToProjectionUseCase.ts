import { IProjectionRepository } from '../../../adapters_interface/repositories';
import { ProjectionPace } from '../../../domain/entities';
import prisma from '../../../frameworks/database/prisma.client';
import { randomUUID } from 'crypto';

export class AddPaceToProjectionUseCase {
  constructor(private projectionRepository: IProjectionRepository) { }

  async execute(
    projectionId: string,
    studentId: string,
    paceCatalogId: string,
    quarter: string,
    week: number
  ): Promise<ProjectionPace> {
    // 1. Verify projection exists and belongs to student
    const projection = await this.projectionRepository.findById(projectionId, studentId);
    if (!projection) {
      throw new Error('Proyección no encontrada');
    }

    // 2. Verify PACE catalog exists
    const paceCatalog = await prisma.paceCatalog.findUnique({
      where: { id: paceCatalogId },
    });
    if (!paceCatalog) {
      throw new Error('PACE no encontrado en el catálogo');
    }

    // 3. Check if this PACE is already in the projection (active, not deleted)
    const existingPace = await prisma.projectionPace.findUnique({
      where: {
        projectionId_paceCatalogId: {
          projectionId,
          paceCatalogId,
        },
      },
    });

    // If the pace exists but is soft-deleted, we'll restore it instead of creating new
    if (existingPace && existingPace.deletedAt === null) {
      throw new Error('Este PACE ya está agregado a la proyección');
    }

    // 4. Check if there's already a PACE at this quarter/week/subject position
    const paceCatalogWithDetails = await prisma.paceCatalog.findUnique({
      where: { id: paceCatalogId },
      include: {
        subSubject: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!paceCatalogWithDetails) {
      throw new Error('Detalles del PACE no encontrados');
    }

    const categoryName = paceCatalogWithDetails.subSubject.category.name;

    // Check for existing PACE at this position in the same category (excluding soft-deleted)
    const existingAtPosition = await prisma.projectionPace.findFirst({
      where: {
        projectionId,
        quarter,
        week,
        deletedAt: null, // Only check active paces
        paceCatalog: {
          subSubject: {
            category: {
              name: categoryName,
            },
          },
        },
      },
    });

    if (existingAtPosition) {
      throw new Error(`Ya existe un PACE de ${categoryName} en ${quarter} Semana ${week}`);
    }

    // 4.5. Validate sequential order - ensure pace numbers are in order within the same subject
    const newPaceNumber = parseInt(paceCatalogWithDetails.code) || 0;
    const subjectName = paceCatalogWithDetails.subSubject.name;

    // Get all paces in the target quarter for the same subject
    const targetQuarterPaces = await prisma.projectionPace.findMany({
      where: {
        projectionId,
        quarter,
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
      if (paceNum < newPaceNumber) {
        beforePace = pace;
      } else if (paceNum > newPaceNumber && !afterPace) {
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
        throw new Error(`No se puede insertar el PACE ${newPaceNumber} entre ${beforeNum} y ${afterNum}. Los PACEs deben estar en orden secuencial sin espacios.`);
      }
    }

    // 5. Restore soft-deleted pace or create new one
    let projectionPace;

    if (existingPace && existingPace.deletedAt !== null) {
      // Restore the soft-deleted pace with new position
      projectionPace = await prisma.projectionPace.update({
        where: { id: existingPace.id },
        data: {
          quarter,
          week,
          deletedAt: null, // Restore by clearing deletedAt
          grade: null, // Reset grade on restore
          isCompleted: false,
          isFailed: false,
          comments: null,
        },
      });
    } else {
      // Create new projection pace
      projectionPace = await prisma.projectionPace.create({
        data: {
          id: randomUUID(),
          projectionId,
          paceCatalogId,
          quarter,
          week,
          grade: null,
          isCompleted: false,
          isFailed: false,
        },
      });
    }

    // 6. Ensure category is tracked for this projection
    const categoryId = paceCatalogWithDetails.subSubject.category.id;
    await prisma.projectionCategory.upsert({
      where: {
        projectionId_categoryId: {
          projectionId,
          categoryId,
        },
      },
      update: {},
      create: {
        id: randomUUID(),
        projectionId,
        categoryId,
      },
    });

    // 7. Map to domain entity
    return new ProjectionPace(
      projectionPace.id,
      projectionPace.projectionId,
      projectionPace.paceCatalogId,
      projectionPace.quarter,
      projectionPace.week,
      projectionPace.grade,
      projectionPace.isCompleted,
      projectionPace.isFailed,
      projectionPace.isUnfinished ?? false,
      projectionPace.originalQuarter ?? undefined,
      projectionPace.originalWeek ?? undefined,
      projectionPace.comments ?? undefined,
      projectionPace.createdAt,
      projectionPace.updatedAt
    );
  }
}

