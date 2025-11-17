import prisma from '../../../frameworks/database/prisma.client';

export class DeleteSchoolMonthlyAssignmentTemplateUseCase {
  async execute(templateId: string, userId: string) {
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
      throw new Error('No tienes permiso para eliminar asignaciones mensuales');
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
      throw new Error('No tienes permiso para eliminar esta asignación');
    }

    // 3. Check if any assignments have grades
    const assignmentWithGrade = await prisma.monthlyAssignment.findFirst({
      where: {
        name: template.name,
        quarter: template.quarter,
        grade: { not: null },
        projection: {
          student: {
            schoolId: user.schoolId,
          },
          schoolYear: template.schoolYear.name,
        },
        deletedAt: null,
      },
    });

    if (assignmentWithGrade) {
      throw new Error('No se puede eliminar una asignación que ya tiene calificaciones. Solo se puede editar.');
    }

    // 4. Soft delete the template
    await prisma.schoolMonthlyAssignmentTemplate.update({
      where: { id: templateId },
      data: { deletedAt: new Date() },
    });

    // 5. Soft delete all related monthly assignments for all students
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
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }
}

