import { IProjectionRepository } from '../../../adapters_interface/repositories';
import { Projection } from '../../../domain/entities';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class GetProjectionsByStudentIdUseCase {
  constructor(private projectionRepository: IProjectionRepository) {}

  async execute(studentId: string, userId?: string): Promise<Projection[]> {
    // If userId provided, verify parent has access
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          userRoles: {
            include: { role: true },
          },
          userStudents: {
            select: { studentId: true },
          },
        },
      });

      const hasParentRole = user?.userRoles.some(ur => ur.role.name === 'PARENT');
      const hasTeacherOrAdminRole = user?.userRoles.some(ur => 
        ur.role.name === 'TEACHER' || ur.role.name === 'SCHOOL_ADMIN'
      );

      // If user is ONLY a parent, verify they're linked to this student
      if (hasParentRole && !hasTeacherOrAdminRole) {
        const linkedStudentIds = new Set(user?.userStudents.map(us => us.studentId) || []);
        
        if (!linkedStudentIds.has(studentId)) {
          throw new Error('No tienes permiso para ver las proyecciones de este estudiante');
        }
      }
    }

    return await this.projectionRepository.findByStudentId(studentId);
  }
}

