import { z } from 'zod';

export const GetDailyGoalsInputSchema = z.object({
  quarter: z.string().regex(/^Q[1-4]$/, 'Quarter must be Q1, Q2, Q3, or Q4'),
  week: z.number().int().min(1).max(9, 'Week must be between 1 and 9'),
});

export type GetDailyGoalsInput = z.infer<typeof GetDailyGoalsInputSchema>;
