import prisma from '../../../frameworks/database/prisma.client';
import { randomUUID } from 'crypto';

export interface CreateSchoolMonthlyAssignmentTemplateInput {
  name: string;
  quarter: string;
  schoolYearId: string;
}

export class CreateSchoolMonthlyAssignmentTemplateUseCase {
  async execute(
    input: CreateSchoolMonthlyAssignmentTemplateInput,
    userId: string
  ) {
    // 1. Verify user has permission (teacher or school admin)
    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: {
        userRoles: {
          include: { role: true }
        }
      }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const userRoles = user.userRoles.map(ur => ur.role.name);
    const isTeacherOrAdmin = userRoles.includes('TEACHER') || 
                            userRoles.includes('SCHOOL_ADMIN') || 
                            userRoles.includes('SUPERADMIN');

    if (!isTeacherOrAdmin) {
      throw new Error('No tienes permiso para crear asignaciones mensuales');
    }

    // 2. Verify school year exists and belongs to user's school
    const schoolYear = await prisma.schoolYear.findFirst({
      where: {
        id: input.schoolYearId,
        schoolId: user.schoolId,
        deletedAt: null,
      },
    });

    if (!schoolYear) {
      throw new Error('Año escolar no encontrado');
    }

    // 3. Validate quarter
    if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(input.quarter)) {
      throw new Error('Trimestre inválido');
    }

    // 4. Validate name
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('El nombre de la asignación es requerido');
    }

    // 5. Check if template already exists (including soft-deleted ones)
    const existing = await prisma.schoolMonthlyAssignmentTemplate.findFirst({
      where: {
        schoolYearId: input.schoolYearId,
        quarter: input.quarter,
        name: input.name.trim(),
      },
    });

    if (existing) {
      if (existing.deletedAt) {
        // Restore soft-deleted template
        const restoredTemplate = await prisma.schoolMonthlyAssignmentTemplate.update({
          where: { id: existing.id },
          data: {
            deletedAt: null,
          },
        });
        
        // Use the restored template
        const template = restoredTemplate;
        
        // 7. Apply to all active projections for this school year
        const projections = await prisma.projection.findMany({
          where: {
            student: {
              schoolId: user.schoolId,
            },
            schoolYear: schoolYear.name,
            isActive: true,
            deletedAt: null,
          },
          include: {
            student: true,
          },
        });

        // Create monthly assignments for all students (only if they don't exist)
        const assignmentsToCreate = [];
        for (const projection of projections) {
          const existingAssignment = await prisma.monthlyAssignment.findFirst({
            where: {
              projectionId: projection.id,
              name: template.name,
              quarter: template.quarter,
              deletedAt: null,
            },
          });

          if (!existingAssignment) {
            assignmentsToCreate.push({
              id: randomUUID(),
              projectionId: projection.id,
              name: template.name,
              quarter: template.quarter,
            });
          }
        }

        if (assignmentsToCreate.length > 0) {
          await prisma.monthlyAssignment.createMany({
            data: assignmentsToCreate,
          });
        }

        return {
          id: template.id,
          name: template.name,
          quarter: template.quarter,
          schoolYearId: template.schoolYearId,
          studentsAffected: assignmentsToCreate.length,
        };
      } else {
        throw new Error('Esta asignación ya existe para este trimestre');
      }
    }

    // 6. Create the template
    const template = await prisma.schoolMonthlyAssignmentTemplate.create({
      data: {
        id: randomUUID(),
        schoolYearId: input.schoolYearId,
        quarter: input.quarter,
        name: input.name.trim(),
      },
    });

    // 7. Apply to all active projections for this school year
    const projections = await prisma.projection.findMany({
      where: {
        student: {
          schoolId: user.schoolId,
        },
        schoolYear: schoolYear.name,
        isActive: true,
        deletedAt: null,
      },
      include: {
        student: true,
      },
    });

    // Create monthly assignments for all students
    const assignmentsToCreate = projections.map(projection => ({
      id: randomUUID(),
      projectionId: projection.id,
      name: input.name.trim(),
      quarter: input.quarter,
      grade: null,
    }));

    if (assignmentsToCreate.length > 0) {
      await prisma.monthlyAssignment.createMany({
        data: assignmentsToCreate,
        skipDuplicates: true, // Skip if assignment already exists
      });
    }

    return {
      id: template.id,
      name: template.name,
      quarter: template.quarter,
      schoolYearId: template.schoolYearId,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
      studentsAffected: assignmentsToCreate.length,
    };
  }
}

