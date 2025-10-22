import { z } from 'zod';

// Base daily goal schema
const DailyGoalSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  quarter: z.string().regex(/^Q[1-4]$/, 'Quarter must be Q1, Q2, Q3, or Q4'),
  week: z.number().int().min(1).max(9, 'Week must be between 1 and 9'),
  dayOfWeek: z.number().int().min(0).max(4, 'Day of week must be between 0 (Monday) and 4 (Friday)'),
  text: z.string().min(1, 'Goal text is required'),
  isCompleted: z.boolean().default(false),
  notes: z.string().optional(),
  notesCompleted: z.boolean().default(false),
});

// Create daily goal DTO
export const CreateDailyGoalDTO = DailyGoalSchema.extend({
  projectionId: z.string().min(1, 'Projection ID is required'),
});

// Update daily goal DTO
export const UpdateDailyGoalDTO = DailyGoalSchema.partial().extend({
  id: z.string().min(1, 'Daily goal ID is required'),
});

// Get daily goals by projection, quarter, and week
export const GetDailyGoalsDTO = z.object({
  projectionId: z.string().min(1, 'Projection ID is required'),
  quarter: z.string().regex(/^Q[1-4]$/, 'Quarter must be Q1, Q2, Q3, or Q4'),
  week: z.number().int().min(1).max(9, 'Week must be between 1 and 9'),
});

// Update daily goal completion status
export const UpdateDailyGoalCompletionDTO = z.object({
  id: z.string().min(1, 'Daily goal ID is required'),
  isCompleted: z.boolean(),
});

// Update daily goal notes
export const UpdateDailyGoalNotesDTO = z.object({
  id: z.string().min(1, 'Daily goal ID is required'),
  notes: z.string().optional(),
  notesCompleted: z.boolean().optional(),
});

// Add note to history
export const AddNoteToHistoryDTO = z.object({
  dailyGoalId: z.string().min(1, 'Daily goal ID is required'),
  text: z.string().min(1, 'Note text is required'),
});

// Types
export type CreateDailyGoalInput = z.infer<typeof CreateDailyGoalDTO>;
export type UpdateDailyGoalInput = z.infer<typeof UpdateDailyGoalDTO>;
export type GetDailyGoalsInput = z.infer<typeof GetDailyGoalsDTO>;
export type UpdateDailyGoalCompletionInput = z.infer<typeof UpdateDailyGoalCompletionDTO>;
export type UpdateDailyGoalNotesInput = z.infer<typeof UpdateDailyGoalNotesDTO>;
export type AddNoteToHistoryInput = z.infer<typeof AddNoteToHistoryDTO>;
