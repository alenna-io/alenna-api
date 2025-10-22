import { IDailyGoalRepository } from '../../../adapters_interface/repositories';
import { DailyGoal, NoteHistory } from '../../../domain/entities';
import prisma from '../prisma.client';
import { DailyGoalMapper, NoteHistoryMapper } from '../mappers';

export class DailyGoalRepository implements IDailyGoalRepository {
  async create(dailyGoal: DailyGoal): Promise<DailyGoal> {
    const created = await prisma.dailyGoal.create({
      data: {
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
      },
    });

    return DailyGoalMapper.toDomain(created);
  }

  async findById(id: string): Promise<DailyGoal | null> {
    const dailyGoal = await prisma.dailyGoal.findFirst({
      where: { 
        id,
        deletedAt: null, // Soft delete filter
      },
    });

    return dailyGoal ? DailyGoalMapper.toDomain(dailyGoal) : null;
  }

  async findByProjectionQuarterWeek(projectionId: string, quarter: string, week: number): Promise<DailyGoal[]> {
    const dailyGoals = await prisma.dailyGoal.findMany({
      where: { 
        projectionId,
        quarter,
        week,
        deletedAt: null, // Soft delete filter
      },
      orderBy: [
        { subject: 'asc' },
        { dayOfWeek: 'asc' },
      ],
    });

    return dailyGoals.map(DailyGoalMapper.toDomain);
  }

  async findByProjection(projectionId: string): Promise<DailyGoal[]> {
    const dailyGoals = await prisma.dailyGoal.findMany({
      where: { 
        projectionId,
        deletedAt: null, // Soft delete filter
      },
      orderBy: [
        { quarter: 'asc' },
        { week: 'asc' },
        { subject: 'asc' },
        { dayOfWeek: 'asc' },
      ],
    });

    return dailyGoals.map(DailyGoalMapper.toDomain);
  }

  async update(dailyGoal: DailyGoal): Promise<DailyGoal> {
    const updated = await prisma.dailyGoal.update({
      where: { id: dailyGoal.id },
      data: {
        subject: dailyGoal.subject,
        quarter: dailyGoal.quarter,
        week: dailyGoal.week,
        dayOfWeek: dailyGoal.dayOfWeek,
        text: dailyGoal.text,
        isCompleted: dailyGoal.isCompleted,
        notes: dailyGoal.notes || null,
        notesCompleted: dailyGoal.notesCompleted,
      },
    });

    return DailyGoalMapper.toDomain(updated);
  }

  async updateCompletionStatus(id: string, isCompleted: boolean): Promise<DailyGoal> {
    const updated = await prisma.dailyGoal.update({
      where: { id },
      data: { isCompleted },
    });

    return DailyGoalMapper.toDomain(updated);
  }

  async updateNotes(id: string, notes?: string, notesCompleted?: boolean): Promise<DailyGoal> {
    const updated = await prisma.dailyGoal.update({
      where: { id },
      data: { 
        notes: notes || null,
        notesCompleted: notesCompleted ?? false,
      },
    });

    return DailyGoalMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.dailyGoal.delete({
      where: { id },
    });
  }

  async softDelete(id: string): Promise<void> {
    await prisma.dailyGoal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async addNoteToHistory(noteHistory: NoteHistory): Promise<NoteHistory> {
    const created = await prisma.noteHistory.create({
      data: {
        id: noteHistory.id,
        dailyGoalId: noteHistory.dailyGoalId,
        text: noteHistory.text,
        completedDate: noteHistory.completedDate,
      },
    });

    return NoteHistoryMapper.toDomain(created);
  }

  async getNoteHistoryByDailyGoalId(dailyGoalId: string): Promise<NoteHistory[]> {
    const noteHistory = await prisma.noteHistory.findMany({
      where: { dailyGoalId },
      orderBy: { completedDate: 'desc' },
    });

    return noteHistory.map(NoteHistoryMapper.toDomain);
  }
}
