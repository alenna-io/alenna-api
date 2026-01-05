import { MonthlyAssignment, MonthlyAssignmentGradeHistory } from '../../../domain/entities';

export class MonthlyAssignmentMapper {
  static toDomain(raw: any): MonthlyAssignment {
    return new MonthlyAssignment(
      raw.id,
      raw.projectionId,
      raw.name,
      raw.quarter,
      raw.grade,
      raw.createdAt,
      raw.updatedAt,
      raw.deletedAt
    );
  }

  static toPrisma(assignment: MonthlyAssignment): any {
    return {
      id: assignment.id,
      projectionId: assignment.projectionId,
      name: assignment.name,
      quarter: assignment.quarter,
      grade: assignment.grade,
      deletedAt: null,
    };
  }

  static toPrismaUpdate(assignment: Partial<MonthlyAssignment>): any {
    return {
      ...(assignment.name && { name: assignment.name }),
      ...(assignment.grade && { grade: assignment.grade }),
      ...(assignment.deletedAt && { deletedAt: assignment.deletedAt }),
      ...(assignment.updatedAt && { updatedAt: assignment.updatedAt }),
    };
  }
}

export class MonthlyAssignmentGradeHistoryMapper {
  static toDomain(raw: any): MonthlyAssignmentGradeHistory {
    return new MonthlyAssignmentGradeHistory(
      raw.id,
      raw.monthlyAssignmentId,
      raw.grade,
      raw.date,
      raw.note,
      raw.createdAt
    );
  }

  static toPersistence(history: MonthlyAssignmentGradeHistory): any {
    return {
      id: history.id,
      monthlyAssignmentId: history.monthlyAssignmentId,
      grade: history.grade,
      date: history.date,
      note: history.note,
      createdAt: history.createdAt,
    };
  }
}

