import type {
  MonthlyAssignment
} from '../../domain/entities';

export interface IMonthlyAssignmentsRepository {
  findById(id: string): Promise<MonthlyAssignment | null>;
  findByProjectionId(projectionId: string): Promise<MonthlyAssignment[]>;
  create(monthlyAssignment: MonthlyAssignment): Promise<MonthlyAssignment>;
  update(id: string, monthlyAssignment: Partial<MonthlyAssignment>): Promise<MonthlyAssignment>;
  delete(id: string): Promise<void>;
}