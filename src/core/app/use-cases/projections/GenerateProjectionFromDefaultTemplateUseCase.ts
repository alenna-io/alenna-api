import { IProjectionRepository } from '../../../adapters_interface/repositories';
import { Projection } from '../../../domain/entities';
import prisma from '../../../frameworks/database/prisma.client';
import { randomUUID } from 'crypto';
import { generateDefaultTemplateProjection, DefaultTemplateSubjectInput } from './DefaultTemplateProjectionAlgorithm';
import { CreateProjectionInput } from '../../dtos';

export interface GenerateProjectionFromDefaultTemplateInput {
  studentId: string;
  schoolYear: string;
  templateId: string;
}

export class GenerateProjectionFromDefaultTemplateUseCase {
  constructor(private projectionRepository: IProjectionRepository) {}

  async execute(input: GenerateProjectionFromDefaultTemplateInput): Promise<Projection> {
    // Check if there's already an active projection for this student
    const activeProjection = await this.projectionRepository.findActiveByStudentId(input.studentId);
    if (activeProjection) {
      throw new Error('El estudiante ya tiene una proyección activa. Debe desactivar o eliminar la proyección existente antes de crear una nueva.');
    }

    // Check if there's already a projection for this student and school year
    const existingProjection = await this.projectionRepository.findByStudentIdAndSchoolYear(input.studentId, input.schoolYear);
    if (existingProjection) {
      throw new Error(`Ya existe una proyección para este estudiante en el año escolar ${input.schoolYear}. Solo se permite una proyección por estudiante por año escolar.`);
    }

    // 1. Fetch the template with its subjects
    const template = await prisma.projectionTemplate.findUnique({
      where: { id: input.templateId },
      include: {
        templateSubjects: {
          include: {
            subSubject: true,
          },
        },
      },
    });

    if (!template) {
      throw new Error('Plantilla no encontrada');
    }

    // Verify this is a default template
    if (!template.isDefault) {
      throw new Error('Este endpoint solo es válido para plantillas predeterminadas (L1-L8). Use el endpoint de generación estándar para plantillas personalizadas.');
    }

    // 2. Convert template subjects to algorithm input format
    const subjects: DefaultTemplateSubjectInput[] = template.templateSubjects.map(ts => ({
      subSubjectId: ts.subSubjectId,
      subSubjectName: ts.subSubject.name,
      startPace: ts.startPace,
      endPace: ts.endPace,
      skipPaces: ts.skipPaces || [],
    }));

    // 3. Generate the projection using the DEFAULT TEMPLATE algorithm (fixed pairing)
    const quarterFormat = generateDefaultTemplateProjection(subjects);

    // 4. Create the projection in the database
    const now = new Date();
    const projectionData: CreateProjectionInput = {
      schoolYear: input.schoolYear,
      startDate: now.toISOString(),
      endDate: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString(),
      isActive: true,
      notes: `Proyección creada desde plantilla predeterminada: ${template.name}`,
    };

    const projection = Projection.create({
      id: randomUUID(),
      studentId: input.studentId,
      schoolYear: projectionData.schoolYear,
      startDate: new Date(projectionData.startDate),
      endDate: new Date(projectionData.endDate),
      isActive: projectionData.isActive ?? true,
      notes: projectionData.notes,
    });

    const createdProjection = await this.projectionRepository.create(projection);

    // 5. Create ProjectionPace records for each generated pace
    const projectionPacesToCreate: Array<{
      id: string;
      projectionId: string;
      paceCatalogId: string;
      quarter: string;
      week: number;
    }> = [];

    // Process each subject in the quarter format
    for (const [subjectName, subjectData] of Object.entries(quarterFormat)) {
      // Find the subject input to get subSubjectId
      const subjectInput = subjects.find(s => s.subSubjectName === subjectName);
      if (!subjectInput) {
        console.warn(`Subject ${subjectName} not found in template subjects`);
        continue;
      }

      // Process each quarter
      for (let quarterIdx = 0; quarterIdx < 4; quarterIdx++) {
        const quarter = `Q${quarterIdx + 1}`;
        const weeks = subjectData.quarters[quarterIdx];

        // Process each week
        for (let weekIdx = 0; weekIdx < weeks.length; weekIdx++) {
          const week = weekIdx + 1;
          const paceCode = weeks[weekIdx];

          // Skip if no pace assigned (empty string)
          if (!paceCode || paceCode.trim() === '') {
            continue;
          }

          // Find the PaceCatalog entry by code
          let paceCatalog = await prisma.paceCatalog.findFirst({
            where: {
              code: String(paceCode),
              subSubjectId: subjectInput.subSubjectId,
            },
          });

          // If not found in selected subject, search across all sub-subjects in the same category
          if (!paceCatalog) {
            const selectedSubSubject = await prisma.subSubject.findUnique({
              where: { id: subjectInput.subSubjectId },
              include: { category: true },
            });

            if (selectedSubSubject) {
              paceCatalog = await prisma.paceCatalog.findFirst({
                where: {
                  code: String(paceCode),
                  subSubject: {
                    categoryId: selectedSubSubject.categoryId,
                  },
                },
                include: {
                  subSubject: true,
                },
              });
            }
          }

          if (!paceCatalog) {
            console.warn(`PaceCatalog not found for code ${paceCode} in subject ${subjectName}`);
            continue;
          }

          // Check if this pace is already in the projection
          const existingPace = await prisma.projectionPace.findUnique({
            where: {
              projectionId_paceCatalogId: {
                projectionId: createdProjection.id,
                paceCatalogId: paceCatalog.id,
              },
            },
          });

          if (!existingPace) {
            projectionPacesToCreate.push({
              id: randomUUID(),
              projectionId: createdProjection.id,
              paceCatalogId: paceCatalog.id,
              quarter,
              week,
            });
          }
        }
      }
    }

    // 6. Bulk create all projection paces
    if (projectionPacesToCreate.length > 0) {
      await prisma.projectionPace.createMany({
        data: projectionPacesToCreate.map(pace => ({
          id: pace.id,
          projectionId: pace.projectionId,
          paceCatalogId: pace.paceCatalogId,
          quarter: pace.quarter,
          week: pace.week,
          grade: null,
          isCompleted: false,
          isFailed: false,
          comments: null,
        })),
        skipDuplicates: true,
      });
    }

    return createdProjection;
  }
}

