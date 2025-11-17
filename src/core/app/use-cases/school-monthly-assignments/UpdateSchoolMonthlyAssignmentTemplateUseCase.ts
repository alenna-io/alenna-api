import prisma from '../../../frameworks/database/prisma.client';

export class UpdateSchoolMonthlyAssignmentTemplateUseCase {
  async execute(
    templateId: string,
    input: { name: string },
    userId: string
  ) {
    // 1. Verify user has permission
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
      throw new Error('No tienes permiso para editar asignaciones mensuales');
    }

    // 2. Verify template exists and belongs to user's school
    const template = await prisma.schoolMonthlyAssignmentTemplate.findFirst({
      where: {
        id: templateId,
        deletedAt: null,
      },
      include: {
        schoolYear: true,
      },
    });

    if (!template) {
      throw new Error('Plantilla de asignación no encontrada');
    }

    if (template.schoolYear.schoolId !== user.schoolId) {
      throw new Error('No tienes permiso para editar esta asignación');
    }

    // 3. Check if new name already exists for this quarter and school year
    const existing = await prisma.schoolMonthlyAssignmentTemplate.findFirst({
      where: {
        schoolYearId: template.schoolYearId,
        quarter: template.quarter,
        name: input.name.trim(),
        deletedAt: null,
        id: { not: templateId },
      },
    });

    if (existing) {
      throw new Error('Ya existe una asignación con este nombre para este trimestre');
    }

    // 4. Update the template name
    const updatedTemplate = await prisma.schoolMonthlyAssignmentTemplate.update({
      where: { id: templateId },
      data: {
        name: input.name.trim(),
      },
    });

    // 5. Update all related monthly assignments for all students
    await prisma.monthlyAssignment.updateMany({
      where: {
        name: template.name,
        quarter: template.quarter,
        projection: {
          student: {
            schoolId: user.schoolId,
          },
          schoolYear: template.schoolYear.name,
        },
        deletedAt: null,
      },
      data: {
        name: input.name.trim(),
      },
    });

    return {
      id: updatedTemplate.id,
      name: updatedTemplate.name,
      quarter: updatedTemplate.quarter,
      schoolYearId: updatedTemplate.schoolYearId,
      createdAt: updatedTemplate.createdAt.toISOString(),
      updatedAt: updatedTemplate.updatedAt.toISOString(),
    };
  }
}

