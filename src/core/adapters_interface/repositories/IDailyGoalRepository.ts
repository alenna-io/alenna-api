import { DailyGoal, NoteHistory } from '../../domain/entities';

export interface IDailyGoalRepository {
  // Create operations
  create(dailyGoal: DailyGoal): Promise<DailyGoal>;
  
  // Read operations
  findById(id: string): Promise<DailyGoal | null>;
  findByProjectionQuarterWeek(projectionId: string, quarter: string, week: number): Promise<DailyGoal[]>;
  findByProjection(projectionId: string): Promise<DailyGoal[]>;
  
  // Update operations
  update(dailyGoal: DailyGoal): Promise<DailyGoal>;
  updateCompletionStatus(id: string, isCompleted: boolean): Promise<DailyGoal>;
  updateNotes(id: string, notes?: string, notesCompleted?: boolean): Promise<DailyGoal>;
  
  // Delete operations
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;
  
  // Note history operations
  addNoteToHistory(noteHistory: NoteHistory): Promise<NoteHistory>;
  getNoteHistoryByDailyGoalId(dailyGoalId: string): Promise<NoteHistory[]>;
}
