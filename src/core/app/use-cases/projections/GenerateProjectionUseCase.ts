import { IProjectionRepository } from '../../../adapters_interface/repositories';
import { Projection } from '../../../domain/entities';
import prisma from '../../../frameworks/database/prisma.client';
import { randomUUID } from 'crypto';
import { generateProjection, SubjectInput } from './ProjectionAlgorithm';
import { CreateProjectionInput } from '../../dtos';

export interface GenerateProjectionInput {
  studentId: string;
  schoolYear: string;
  subjects: SubjectInput[];
}

export class GenerateProjectionUseCase {
  constructor(private projectionRepository: IProjectionRepository) { }

  async execute(input: GenerateProjectionInput): Promise<Projection> {
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

    // 1. Generate the projection using the algorithm
    const quarterFormat = generateProjection(input.subjects);

    // 2. Create the projection in the database
    const now = new Date();
    const projectionData: CreateProjectionInput = {
      schoolYear: input.schoolYear,
      startDate: now.toISOString(),
      endDate: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString(),
      isActive: true,
      notes: `Proyección generada automáticamente con ${input.subjects.length} materias`,
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

    // 3. Create ProjectionPace records for each generated pace
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
      const subjectInput = input.subjects.find(s => s.subSubjectName === subjectName);
      if (!subjectInput) {
        console.warn(`Subject ${subjectName} not found in input subjects`);
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
          // Since paces can span multiple sub-subjects (e.g., Math L3 to Math L4),
          // we search by code across the category, not just the selected subSubjectId
          // First try to find in the selected subject's catalog
          let paceCatalog = await prisma.paceCatalog.findFirst({
            where: {
              code: String(paceCode), // Ensure it's a string
              subSubjectId: subjectInput.subSubjectId,
            },
          });

          // If not found in selected subject, search across all sub-subjects in the same category
          // This handles cases where paces span multiple levels (e.g., 1030-1048 spanning Math L3 and Math L4)
          if (!paceCatalog) {
            // Get the selected subject to find its category
            const selectedSubSubject = await prisma.subSubject.findUnique({
              where: { id: subjectInput.subSubjectId },
              include: { category: true },
            });

            if (selectedSubSubject) {
              // Search in all sub-subjects of the same category
              // Order by subSubject name to prefer the one that matches the subject name pattern
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
                orderBy: {
                  subSubject: {
                    name: 'asc',
                  },
                },
              });
            }
          }

          if (!paceCatalog) {
            console.error(
              `PaceCatalog not found for code ${paceCode} in subject ${subjectName} (subSubjectId: ${subjectInput.subSubjectId}). This pace will be skipped.`
            );
            continue;
          }

          // Check if this pace is already in the projection (shouldn't happen, but check anyway)
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

    // 4. Bulk create all projection paces
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

    // 5. Track categories used in this projection
    const categoryIds = new Set<string>();
    for (const pace of projectionPacesToCreate) {
      const paceCatalog = await prisma.paceCatalog.findUnique({
        where: { id: pace.paceCatalogId },
        include: {
          subSubject: {
            include: {
              category: true,
            },
          },
        },
      });
      if (paceCatalog?.subSubject?.category) {
        categoryIds.add(paceCatalog.subSubject.category.id);
      }
    }

    // Create ProjectionCategory records
    if (categoryIds.size > 0) {
      await prisma.projectionCategory.createMany({
        data: Array.from(categoryIds).map(categoryId => ({
          id: randomUUID(),
          projectionId: createdProjection.id,
          categoryId,
        })),
        skipDuplicates: true,
      });
    }

    // Apply existing monthly assignment templates for this school year
    await this.applyMonthlyAssignmentTemplates(createdProjection.id, input.schoolYear, input.studentId);

    return createdProjection;
  }

  private async applyMonthlyAssignmentTemplates(projectionId: string, schoolYearName: string, studentId: string): Promise<void> {
    try {
      // Get student to find schoolId
      const student = await prisma.student.findUnique({
        where: { id: studentId, deletedAt: null },
      });

      if (!student) {
        return; // Student not found, skip
      }

      // Find school year by name
      const schoolYear = await prisma.schoolYear.findFirst({
        where: {
          name: schoolYearName,
          schoolId: student.schoolId,
          deletedAt: null,
        },
      });

      if (!schoolYear) {
        return; // School year not found, skip
      }

      // Get all existing monthly assignment templates for this school year
      const templates = await prisma.schoolMonthlyAssignmentTemplate.findMany({
        where: {
          schoolYearId: schoolYear.id,
          deletedAt: null,
        },
      });

      // Create monthly assignments for the new projection based on templates
      if (templates.length > 0) {
        const assignmentsToCreate = templates.map(template => ({
          id: randomUUID(),
          projectionId,
          name: template.name,
          quarter: template.quarter,
          grade: null,
        }));

        await prisma.monthlyAssignment.createMany({
          data: assignmentsToCreate,
          skipDuplicates: true,
        });
      }
    } catch (error) {
      // Log error but don't fail projection creation if monthly assignments fail
      console.error('Error applying monthly assignment templates:', error);
    }
  }
}

