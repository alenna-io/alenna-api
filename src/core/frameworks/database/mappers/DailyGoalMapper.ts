import { DailyGoal as PrismaDailyGoal, NoteHistory as PrismaNoteHistory } from '@prisma/client';
import { DailyGoal, NoteHistory } from '../../../domain/entities';

export class DailyGoalMapper {
  static toDomain(prismaDailyGoal: PrismaDailyGoal): DailyGoal {
    return new DailyGoal(
      prismaDailyGoal.id,
      prismaDailyGoal.projectionId,
      prismaDailyGoal.subject,
      prismaDailyGoal.quarter,
      prismaDailyGoal.week,
      prismaDailyGoal.dayOfWeek,
      prismaDailyGoal.text,
      prismaDailyGoal.isCompleted,
      prismaDailyGoal.notes || undefined,
      prismaDailyGoal.notesCompleted,
      prismaDailyGoal.deletedAt || undefined,
      prismaDailyGoal.createdAt,
      prismaDailyGoal.updatedAt
    );
  }

  static toPrisma(dailyGoal: DailyGoal): Omit<PrismaDailyGoal, 'createdAt' | 'updatedAt'> {
    return {
      id: dailyGoal.id,
      projectionId: dailyGoal.projectionId,
      subject: dailyGoal.subject,
      quarter: dailyGoal.quarter,
      week: dailyGoal.week,
      dayOfWeek: dailyGoal.dayOfWeek,
      text: dailyGoal.text,
      isCompleted: dailyGoal.isCompleted,
      notes: dailyGoal.notes || null,
      notesCompleted: dailyGoal.notesCompleted,
      deletedAt: dailyGoal.deletedAt || null,
    };
  }
}

export class NoteHistoryMapper {
  static toDomain(prismaNoteHistory: PrismaNoteHistory): NoteHistory {
    return new NoteHistory(
      prismaNoteHistory.id,
      prismaNoteHistory.dailyGoalId,
      prismaNoteHistory.text,
      prismaNoteHistory.completedDate,
      prismaNoteHistory.createdAt
    );
  }

  static toPrisma(noteHistory: NoteHistory): Omit<PrismaNoteHistory, 'createdAt'> {
    return {
      id: noteHistory.id,
      dailyGoalId: noteHistory.dailyGoalId,
      text: noteHistory.text,
      completedDate: noteHistory.completedDate,
    };
  }
}
