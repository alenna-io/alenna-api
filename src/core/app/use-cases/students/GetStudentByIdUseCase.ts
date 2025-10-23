import { IStudentRepository } from '../../../adapters_interface/repositories';
import { Student } from '../../../domain/entities';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class GetStudentByIdUseCase {
  constructor(private studentRepository: IStudentRepository) {}

  async execute(studentId: string, schoolId: string, userId?: string): Promise<Student> {
    const student = await this.studentRepository.findById(studentId, schoolId);

    if (!student) {
      throw new Error('Student not found');
    }

    // If userId provided, check if parent has access to this student
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          userRoles: {
            include: {
              role: true,
            },
          },
          userStudents: {
            select: {
              studentId: true,
            },
          },
        },
      });

      const hasParentRole = user?.userRoles.some(ur => ur.role.name === 'PARENT');
      const hasTeacherOrAdminRole = user?.userRoles.some(ur => 
        ur.role.name === 'TEACHER' || ur.role.name === 'ADMIN'
      );

      // If user is ONLY a parent, verify they're linked to this student
      if (hasParentRole && !hasTeacherOrAdminRole) {
        const linkedStudentIds = new Set(user?.userStudents.map(us => us.studentId) || []);
        
        if (!linkedStudentIds.has(studentId)) {
          throw new Error('No tienes permiso para ver este estudiante');
        }
      }
    }

    return student;
  }
}

