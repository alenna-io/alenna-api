import { IStudentRepository } from '../../../adapters_interface/repositories';
import { ISchoolYearRepository } from '../../../adapters_interface/repositories';
import { Student } from '../../../domain/entities';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class GetStudentsUseCase {
  constructor(
    private studentRepository: IStudentRepository,
    private schoolYearRepository: ISchoolYearRepository
  ) {}

  async execute(schoolId: string, userId?: string): Promise<Student[]> {
    // If userId provided, check user roles and filter accordingly
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

      const roleNames = user?.userRoles.map(ur => ur.role.name) || [];
      const hasParentRole = roleNames.includes('PARENT');
      const hasTeacherRole = roleNames.includes('TEACHER');
      const hasSchoolAdminRole = roleNames.includes('SCHOOL_ADMIN');
      const hasStudentRole = roleNames.includes('STUDENT');
      const hasTeacherOrAdminRole = hasTeacherRole || hasSchoolAdminRole;

      // Parents: Return only their linked children (read-only)
      if (hasParentRole && !hasTeacherOrAdminRole) {
        const allStudents = await this.studentRepository.findBySchoolId(schoolId);
        const linkedStudentIds = new Set(user?.userStudents.map(us => us.studentId) || []);
        return allStudents.filter(student => linkedStudentIds.has(student.id));
      }

      // Students: Return only their own data (read-only)
      if (hasStudentRole && !hasTeacherOrAdminRole) {
        const ownStudentId = user?.student?.id;
        if (!ownStudentId) {
          return [];
        }
        const ownStudent = await this.studentRepository.findById(ownStudentId, schoolId);
        return ownStudent ? [ownStudent] : [];
      }

      // Teachers: Filter by teacher-student relationship for active school year
      if (hasTeacherRole && !hasSchoolAdminRole) {
        const activeSchoolYear = await this.schoolYearRepository.findActiveBySchoolId(schoolId);
        
        if (!activeSchoolYear) {
          // No active school year, return empty array
          return [];
        }

        // Get all students assigned to this teacher for the active school year
        const teacherStudentRelations = await prisma.teacherStudent.findMany({
          where: {
            teacherId: userId,
            schoolYearId: activeSchoolYear.id,
            deletedAt: null, // Only active assignments
          },
          select: {
            studentId: true,
          },
        });

        const assignedStudentIds = new Set(teacherStudentRelations.map(ts => ts.studentId));
        
        if (assignedStudentIds.size === 0) {
          // Teacher has no assigned students, return empty array
          return [];
        }

        // Get all students and filter to assigned ones
        const allStudents = await this.studentRepository.findBySchoolId(schoolId);
        return allStudents.filter(student => assignedStudentIds.has(student.id));
      }

      // School Admins: Return all students in the school
      if (hasSchoolAdminRole) {
        return this.studentRepository.findBySchoolId(schoolId);
      }
    }

    // Default: Return all students (for backward compatibility or no user context)
    return this.studentRepository.findBySchoolId(schoolId);
  }
}

