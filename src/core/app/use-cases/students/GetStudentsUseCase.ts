import { IStudentRepository } from '../../../adapters_interface/repositories';
import { Student } from '../../../domain/entities';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class GetStudentsUseCase {
  constructor(private studentRepository: IStudentRepository) {}

  async execute(schoolId: string, userId?: string): Promise<Student[]> {
    // If userId provided, check if user is a parent
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
          student: {
            select: {
              id: true,
            },
          },
        },
      });

      // If user is ONLY a parent (no teacher/admin roles), filter to their children
      const hasParentRole = user?.userRoles.some(ur => ur.role.name === 'PARENT');
      const hasTeacherOrAdminRole = user?.userRoles.some(ur => 
        ur.role.name === 'TEACHER' || ur.role.name === 'SCHOOL_ADMIN'
      );
      const hasStudentRole = user?.userRoles.some(ur => ur.role.name === 'STUDENT');

      if (hasParentRole && !hasTeacherOrAdminRole) {
        // Return only linked students
        const allStudents = await this.studentRepository.findBySchoolId(schoolId);
        const linkedStudentIds = new Set(user?.userStudents.map(us => us.studentId) || []);
        
        return allStudents.filter(student => linkedStudentIds.has(student.id));
      }

      if (hasStudentRole && !hasTeacherOrAdminRole) {
        const ownStudentId = user?.student?.id;
        if (!ownStudentId) {
          return [];
        }

        const ownStudent = await this.studentRepository.findById(ownStudentId, schoolId);
        return ownStudent ? [ownStudent] : [];
      }
    }

    // For teachers/admins or no filtering, return all students
    return this.studentRepository.findBySchoolId(schoolId);
  }
}

