import { GradeHistory } from '../../../domain/entities';
import { GradeHistory as PrismaGradeHistory } from '@prisma/client';

export class GradeHistoryMapper {
  static toDomain(gradeHistory: PrismaGradeHistory): GradeHistory {
    return new GradeHistory(
      gradeHistory.id,
      gradeHistory.projectionPaceId,
      gradeHistory.grade,
      gradeHistory.date,
      gradeHistory.note ?? undefined,
      gradeHistory.createdAt
    );
  }
}

