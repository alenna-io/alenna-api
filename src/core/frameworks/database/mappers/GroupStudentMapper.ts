import { GroupStudent as PrismaGroupStudent } from '@prisma/client';
import { GroupStudent } from '../../../domain/entities';

export class GroupStudentMapper {
  static toDomain(prismaGroupStudent: PrismaGroupStudent): GroupStudent {
    return new GroupStudent(
      prismaGroupStudent.id,
      prismaGroupStudent.groupId,
      prismaGroupStudent.studentId,
      prismaGroupStudent.deletedAt,
      prismaGroupStudent.createdAt,
      prismaGroupStudent.updatedAt
    );
  }

  static toPrisma(groupStudent: GroupStudent): Omit<PrismaGroupStudent, 'createdAt' | 'updatedAt'> {
    return {
      id: groupStudent.id,
      groupId: groupStudent.groupId,
      studentId: groupStudent.studentId,
      deletedAt: groupStudent.deletedAt,
    };
  }
}
