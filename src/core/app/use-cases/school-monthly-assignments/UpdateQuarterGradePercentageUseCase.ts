import prisma from '../../../frameworks/database/prisma.client';
import { randomUUID } from 'crypto';

export interface UpdateQuarterGradePercentageInput {
  schoolYearId: string;
  quarter: string;
  percentage: number;
}

export class UpdateQuarterGradePercentageUseCase {
  async execute(
    input: UpdateQuarterGradePercentageInput,
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
      throw new Error('No tienes permiso para actualizar porcentajes de calificación');
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

    // 4. Validate percentage (0-100)
    if (input.percentage < 0 || input.percentage > 100) {
      throw new Error('El porcentaje debe estar entre 0 y 100');
    }

    // 5. Upsert the percentage
    const existing = await prisma.quarterGradePercentage.findFirst({
      where: {
        schoolYearId: input.schoolYearId,
        quarter: input.quarter,
        deletedAt: null,
      },
    });

    if (existing) {
      const updated = await prisma.quarterGradePercentage.update({
        where: { id: existing.id },
        data: { percentage: input.percentage },
      });

      return {
        id: updated.id,
        schoolYearId: updated.schoolYearId,
        quarter: updated.quarter,
        percentage: updated.percentage,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    } else {
      const created = await prisma.quarterGradePercentage.create({
        data: {
          id: randomUUID(),
          schoolYearId: input.schoolYearId,
          quarter: input.quarter,
          percentage: input.percentage,
        },
      });

      return {
        id: created.id,
        schoolYearId: created.schoolYearId,
        quarter: created.quarter,
        percentage: created.percentage,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    }
  }
}

