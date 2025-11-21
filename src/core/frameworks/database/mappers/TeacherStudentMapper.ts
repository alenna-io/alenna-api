import { TeacherStudent as PrismaTeacherStudent } from '@prisma/client';
import { TeacherStudent } from '../../../domain/entities';

export class TeacherStudentMapper {
  static toDomain(prismaTeacherStudent: PrismaTeacherStudent): TeacherStudent {
    return new TeacherStudent(
      prismaTeacherStudent.id,
      prismaTeacherStudent.teacherId,
      prismaTeacherStudent.studentId,
      prismaTeacherStudent.schoolYearId,
      prismaTeacherStudent.deletedAt,
      prismaTeacherStudent.createdAt,
      prismaTeacherStudent.updatedAt,
      prismaTeacherStudent.name
    );
  }
}

