import { z } from 'zod';

export const DailyGoalOutputSchema = z.object({
  id: z.string(),
  subject: z.string(),
  quarter: z.string(),
  week: z.number().int(),
  dayOfWeek: z.number().int(),
  text: z.string(),
  isCompleted: z.boolean(),
  notes: z.string().nullable(),
  notesCompleted: z.boolean(),
});

export const GetDailyGoalsOutputSchema = z.array(DailyGoalOutputSchema);

export type DailyGoalOutput = z.infer<typeof DailyGoalOutputSchema>;
export type GetDailyGoalsOutput = z.infer<typeof GetDailyGoalsOutputSchema>;
