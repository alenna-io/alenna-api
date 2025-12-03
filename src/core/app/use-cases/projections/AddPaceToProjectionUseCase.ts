import { IProjectionRepository } from '../../../adapters_interface/repositories';
import { ProjectionPace } from '../../../domain/entities';
import prisma from '../../../frameworks/database/prisma.client';
import { randomUUID } from 'crypto';

export class AddPaceToProjectionUseCase {
  constructor(private projectionRepository: IProjectionRepository) {}

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
      projectionPace.comments ?? undefined,
      projectionPace.createdAt,
      projectionPace.updatedAt
    );
  }
}

