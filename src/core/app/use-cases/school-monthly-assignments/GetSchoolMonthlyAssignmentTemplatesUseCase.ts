import prisma from '../../../frameworks/database/prisma.client';

export class GetSchoolMonthlyAssignmentTemplatesUseCase {
  async execute(schoolYearId: string, userId: string) {
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
      throw new Error('No tienes permiso para ver asignaciones mensuales');
    }

    // 2. Verify school year exists and belongs to user's school
    const schoolYear = await prisma.schoolYear.findFirst({
      where: {
        id: schoolYearId,
        schoolId: user.schoolId,
        deletedAt: null,
      },
    });

    if (!schoolYear) {
      throw new Error('Año escolar no encontrado');
    }

    // 3. Get all templates for this school year
    const templates = await prisma.schoolMonthlyAssignmentTemplate.findMany({
      where: {
        schoolYearId,
        deletedAt: null,
      },
      orderBy: [
        { quarter: 'asc' },
        { name: 'asc' },
      ],
    });

    // 4. Check if each template has grades assigned
    const templatesWithGrades = await Promise.all(
      templates.map(async (t) => {
        const hasGrades = await prisma.monthlyAssignment.findFirst({
          where: {
            name: t.name,
            quarter: t.quarter,
            grade: { not: null },
            projection: {
              student: {
                schoolId: user.schoolId,
              },
              schoolYear: schoolYear.name,
            },
            deletedAt: null,
          },
        });

        return {
          id: t.id,
          name: t.name,
          quarter: t.quarter,
          schoolYearId: t.schoolYearId,
          hasGrades: !!hasGrades,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        };
      })
    );

    return templatesWithGrades;
  }
}

