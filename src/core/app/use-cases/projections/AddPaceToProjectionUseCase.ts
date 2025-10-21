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
      throw new Error('Projection not found');
    }

    // 2. Verify PACE catalog exists
    const paceCatalog = await prisma.paceCatalog.findUnique({
      where: { id: paceCatalogId },
    });
    if (!paceCatalog) {
      throw new Error('PACE not found in catalog');
    }

    // 3. Check if this PACE is already in the projection
    const existingPace = await prisma.projectionPace.findUnique({
      where: {
        projectionId_paceCatalogId: {
          projectionId,
          paceCatalogId,
        },
      },
    });
    if (existingPace) {
      throw new Error('This PACE is already added to the projection');
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
      throw new Error('PACE details not found');
    }

    const categoryName = paceCatalogWithDetails.subSubject.category.name;

    // Check for existing PACE at this position in the same category
    const existingAtPosition = await prisma.projectionPace.findFirst({
      where: {
        projectionId,
        quarter,
        week,
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
      throw new Error(`A ${categoryName} PACE already exists at ${quarter} Week ${week}`);
    }

    // 5. Create the ProjectionPace
    const projectionPace = await prisma.projectionPace.create({
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

    // 6. Map to domain entity
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

