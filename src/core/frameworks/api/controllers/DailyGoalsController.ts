import { Request, Response } from 'express';
import { container } from '../../di/container';
import { CreateDailyGoalDTO, UpdateDailyGoalDTO, GetDailyGoalsDTO, UpdateDailyGoalCompletionDTO, UpdateDailyGoalNotesDTO, AddNoteToHistoryDTO } from '../../../app/dtos';

export class DailyGoalsController {
  async getDailyGoals(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, projectionId } = req.params;
      const { quarter, week } = req.query;
      const schoolId = req.schoolId!;
      
      // Verify student belongs to school
      const student = await container.getStudentByIdUseCase.execute(studentId, schoolId);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      // Verify projection belongs to student
      const projection = await container.getProjectionByIdUseCase.execute(projectionId, studentId);
      if (!projection) {
        res.status(404).json({ error: 'Projection not found' });
        return;
      }

      const validatedData = GetDailyGoalsDTO.parse({
        projectionId,
        quarter,
        week: parseInt(week as string),
      });

      const dailyGoals = await container.getDailyGoalsUseCase.execute(validatedData);

      // Get projection with paces to extract sub-subject names and build category mapping
      const projectionWithPaces = await container.projectionRepository.findByIdWithPaces(projectionId, studentId);
      if (!projectionWithPaces) {
        res.status(404).json({ error: 'Projection not found' });
        return;
      }

      // Extract unique sub-subject names from projection paces
      const subSubjectNames = new Set<string>();
      const categoryToSubSubjects = new Map<string, string[]>();
      
      projectionWithPaces.projectionPaces.forEach(pp => {
        const subSubjectName = pp.paceCatalog.subSubject.name;
        const categoryName = pp.paceCatalog.subSubject.category.name;
        
        subSubjectNames.add(subSubjectName);
        
        if (!categoryToSubSubjects.has(categoryName)) {
          categoryToSubSubjects.set(categoryName, []);
        }
        const subSubjects = categoryToSubSubjects.get(categoryName)!;
        if (!subSubjects.includes(subSubjectName)) {
          subSubjects.push(subSubjectName);
        }
      });
      
      // Sort sub-subjects for consistent ordering
      const sortedSubSubjects = Array.from(subSubjectNames).sort();

      // Transform to frontend format using actual sub-subject names
      const goalsData: { [subject: string]: any[] } = {};
      
      // Initialize empty arrays for each sub-subject
      sortedSubSubjects.forEach(subject => {
        goalsData[subject] = Array(5).fill(null).map(() => ({
          text: '',
          isCompleted: false,
          notes: undefined,
          notesCompleted: false,
          notesHistory: []
        }));
      });

      // Populate with actual data and load note history
      // Map goals stored with category names to their corresponding sub-subjects
      for (const goal of dailyGoals) {
        const subSubjectsForCategory = categoryToSubSubjects.get(goal.subject) || [];
        
        // For each sub-subject in this category, populate the goal if it doesn't already exist
        // We'll use the first sub-subject as the default, or distribute if needed
        const targetSubSubject = subSubjectsForCategory[0] || goal.subject;
        
        if (goalsData[targetSubSubject] && goal.dayOfWeek < 5) {
          // Only populate if this slot is empty (avoid overwriting existing goals)
          if (!goalsData[targetSubSubject][goal.dayOfWeek]?.id) {
            // Load note history for this goal
            const noteHistory = await container.getNoteHistoryUseCase.execute(goal.id);
            
            goalsData[targetSubSubject][goal.dayOfWeek] = {
              id: goal.id,
              text: goal.text,
              isCompleted: goal.isCompleted,
              notes: goal.notes,
              notesCompleted: goal.notesCompleted,
              notesHistory: noteHistory.map(note => ({
                text: note.text,
                completedDate: note.completedDate.toISOString()
              }))
            };
          }
        }
      }

      res.json(goalsData);
    } catch (error: any) {
      console.error('Error getting daily goals:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ error: error.errors });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to get daily goals' });
    }
  }

  async createDailyGoal(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, projectionId } = req.params;
      const schoolId = req.schoolId!;
      const validatedData = CreateDailyGoalDTO.parse({
        ...req.body,
        projectionId,
      });
      
      // Verify student belongs to school
      const student = await container.getStudentByIdUseCase.execute(studentId, schoolId);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      // Verify projection belongs to student
      const projection = await container.getProjectionByIdUseCase.execute(projectionId, studentId);
      if (!projection) {
        res.status(404).json({ error: 'Projection not found' });
        return;
      }

      const dailyGoal = await container.createDailyGoalUseCase.execute(validatedData);

      res.status(201).json({
        id: dailyGoal.id,
        projectionId: dailyGoal.projectionId,
        subject: dailyGoal.subject,
        quarter: dailyGoal.quarter,
        week: dailyGoal.week,
        dayOfWeek: dailyGoal.dayOfWeek,
        text: dailyGoal.text,
        isCompleted: dailyGoal.isCompleted,
        notes: dailyGoal.notes,
        notesCompleted: dailyGoal.notesCompleted,
        createdAt: dailyGoal.createdAt?.toISOString(),
        updatedAt: dailyGoal.updatedAt?.toISOString(),
      });
    } catch (error: any) {
      console.error('Error creating daily goal:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ error: error.errors });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to create daily goal' });
    }
  }

  async updateDailyGoal(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, projectionId, goalId } = req.params;
      const schoolId = req.schoolId!;
      const validatedData = UpdateDailyGoalDTO.parse({
        ...req.body,
        id: goalId,
      });
      
      // Verify student belongs to school
      const student = await container.getStudentByIdUseCase.execute(studentId, schoolId);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      // Verify projection belongs to student
      const projection = await container.getProjectionByIdUseCase.execute(projectionId, studentId);
      if (!projection) {
        res.status(404).json({ error: 'Projection not found' });
        return;
      }

      const dailyGoal = await container.updateDailyGoalUseCase.execute(validatedData);

      res.json({
        id: dailyGoal.id,
        projectionId: dailyGoal.projectionId,
        subject: dailyGoal.subject,
        quarter: dailyGoal.quarter,
        week: dailyGoal.week,
        dayOfWeek: dailyGoal.dayOfWeek,
        text: dailyGoal.text,
        isCompleted: dailyGoal.isCompleted,
        notes: dailyGoal.notes,
        notesCompleted: dailyGoal.notesCompleted,
        createdAt: dailyGoal.createdAt?.toISOString(),
        updatedAt: dailyGoal.updatedAt?.toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating daily goal:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ error: error.errors });
        return;
      }
      
      if (error.message === 'Daily goal not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to update daily goal' });
    }
  }

  async updateDailyGoalCompletion(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, projectionId, goalId } = req.params;
      const schoolId = req.schoolId!;
      const validatedData = UpdateDailyGoalCompletionDTO.parse({
        ...req.body,
        id: goalId,
      });
      
      // Verify student belongs to school
      const student = await container.getStudentByIdUseCase.execute(studentId, schoolId);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      // Verify projection belongs to student
      const projection = await container.getProjectionByIdUseCase.execute(projectionId, studentId);
      if (!projection) {
        res.status(404).json({ error: 'Projection not found' });
        return;
      }

      const dailyGoal = await container.updateDailyGoalCompletionUseCase.execute(validatedData);

      res.json({
        id: dailyGoal.id,
        projectionId: dailyGoal.projectionId,
        subject: dailyGoal.subject,
        quarter: dailyGoal.quarter,
        week: dailyGoal.week,
        dayOfWeek: dailyGoal.dayOfWeek,
        text: dailyGoal.text,
        isCompleted: dailyGoal.isCompleted,
        notes: dailyGoal.notes,
        notesCompleted: dailyGoal.notesCompleted,
        createdAt: dailyGoal.createdAt?.toISOString(),
        updatedAt: dailyGoal.updatedAt?.toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating daily goal completion:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ error: error.errors });
        return;
      }
      
      if (error.message === 'Daily goal not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to update daily goal completion' });
    }
  }

  async updateDailyGoalNotes(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, projectionId, goalId } = req.params;
      const schoolId = req.schoolId!;
      const validatedData = UpdateDailyGoalNotesDTO.parse({
        ...req.body,
        id: goalId,
      });
      
      // Verify student belongs to school
      const student = await container.getStudentByIdUseCase.execute(studentId, schoolId);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      // Verify projection belongs to student
      const projection = await container.getProjectionByIdUseCase.execute(projectionId, studentId);
      if (!projection) {
        res.status(404).json({ error: 'Projection not found' });
        return;
      }

      const dailyGoal = await container.updateDailyGoalNotesUseCase.execute(validatedData);

      res.json({
        id: dailyGoal.id,
        projectionId: dailyGoal.projectionId,
        subject: dailyGoal.subject,
        quarter: dailyGoal.quarter,
        week: dailyGoal.week,
        dayOfWeek: dailyGoal.dayOfWeek,
        text: dailyGoal.text,
        isCompleted: dailyGoal.isCompleted,
        notes: dailyGoal.notes,
        notesCompleted: dailyGoal.notesCompleted,
        createdAt: dailyGoal.createdAt?.toISOString(),
        updatedAt: dailyGoal.updatedAt?.toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating daily goal notes:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ error: error.errors });
        return;
      }
      
      if (error.message === 'Daily goal not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to update daily goal notes' });
    }
  }

  async addNoteToHistory(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, projectionId, goalId } = req.params;
      const schoolId = req.schoolId!;
      const validatedData = AddNoteToHistoryDTO.parse({
        ...req.body,
        dailyGoalId: goalId,
      });
      
      // Verify student belongs to school
      const student = await container.getStudentByIdUseCase.execute(studentId, schoolId);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      // Verify projection belongs to student
      const projection = await container.getProjectionByIdUseCase.execute(projectionId, studentId);
      if (!projection) {
        res.status(404).json({ error: 'Projection not found' });
        return;
      }

      const noteHistory = await container.addNoteToHistoryUseCase.execute(validatedData);

      res.status(201).json({
        id: noteHistory.id,
        dailyGoalId: noteHistory.dailyGoalId,
        text: noteHistory.text,
        completedDate: noteHistory.completedDate.toISOString(),
        createdAt: noteHistory.createdAt?.toISOString(),
      });
    } catch (error: any) {
      console.error('Error adding note to history:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ error: error.errors });
        return;
      }
      
      if (error.message === 'Daily goal not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to add note to history' });
    }
  }

  async getNoteHistory(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, projectionId, goalId } = req.params;
      const schoolId = req.schoolId!;
      
      // Verify student belongs to school
      const student = await container.getStudentByIdUseCase.execute(studentId, schoolId);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      // Verify projection belongs to student
      const projection = await container.getProjectionByIdUseCase.execute(projectionId, studentId);
      if (!projection) {
        res.status(404).json({ error: 'Projection not found' });
        return;
      }

      const noteHistory = await container.getNoteHistoryUseCase.execute(goalId);

      res.json(noteHistory.map(note => ({
        id: note.id,
        dailyGoalId: note.dailyGoalId,
        text: note.text,
        completedDate: note.completedDate.toISOString(),
        createdAt: note.createdAt?.toISOString(),
      })));
    } catch (error: any) {
      console.error('Error getting note history:', error);
      
      if (error.message === 'Daily goal not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to get note history' });
    }
  }

  async deleteDailyGoal(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, projectionId, goalId } = req.params;
      const schoolId = req.schoolId!;
      
      // Verify student belongs to school
      const student = await container.getStudentByIdUseCase.execute(studentId, schoolId);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      // Verify projection belongs to student
      const projection = await container.getProjectionByIdUseCase.execute(projectionId, studentId);
      if (!projection) {
        res.status(404).json({ error: 'Projection not found' });
        return;
      }

      await container.deleteDailyGoalUseCase.execute(goalId);

      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting daily goal:', error);
      
      if (error.message === 'Daily goal not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to delete daily goal' });
    }
  }
}
