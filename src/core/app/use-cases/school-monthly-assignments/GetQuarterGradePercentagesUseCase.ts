import prisma from '../../../frameworks/database/prisma.client';

export class GetQuarterGradePercentagesUseCase {
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
      throw new Error('No tienes permiso para ver porcentajes de calificación');
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

    // 3. Get all percentages for this school year
    const percentages = await prisma.quarterGradePercentage.findMany({
      where: {
        schoolYearId,
        deletedAt: null,
      },
      orderBy: { quarter: 'asc' },
    });

    // Return as a map for easy lookup
    const result: Record<string, number> = {};
    percentages.forEach(p => {
      result[p.quarter] = p.percentage;
    });

    // Ensure all quarters have a value (default to 0 if not set)
    ['Q1', 'Q2', 'Q3', 'Q4'].forEach(quarter => {
      if (!result[quarter]) {
        result[quarter] = 0;
      }
    });

    return result;
  }
}

