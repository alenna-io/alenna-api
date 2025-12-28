import { IProjectionRepository } from '../../../adapters_interface/repositories';
import { Projection } from '../../../domain/entities';
import { CreateProjectionInput } from '../../dtos';
import { randomUUID } from 'crypto';
import prisma from '../../../frameworks/database/prisma.client';

export class CreateProjectionUseCase {
  constructor(private projectionRepository: IProjectionRepository) { }

  async execute(data: CreateProjectionInput, studentId: string): Promise<Projection> {
    // Check if there's already an active projection for this student
    const activeProjection = await this.projectionRepository.findActiveByStudentId(studentId);
    if (activeProjection) {
      throw new Error('El estudiante ya tiene una proyección activa. Debe desactivar o eliminar la proyección existente antes de crear una nueva.');
    }

    // Check if there's already a projection for this student and school year
    const existingProjection = await this.projectionRepository.findByStudentIdAndSchoolYear(studentId, data.schoolYear);
    if (existingProjection) {
      throw new Error(`Ya existe una proyección para este estudiante en el año escolar ${data.schoolYear}. Solo se permite una proyección por estudiante por año escolar.`);
    }

    const projection = Projection.create({
      id: randomUUID(),
      studentId,
      schoolYear: data.schoolYear,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isActive: data.isActive,
      notes: data.notes,
    });

    const createdProjection = await this.projectionRepository.create(projection);

    // Apply existing monthly assignment templates for this school year
    await this.applyMonthlyAssignmentTemplates(createdProjection.id, data.schoolYear, studentId);

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

