import { z } from 'zod';

export const UpdateMonthlyGoalGradeDTO = z.object({
  grade: z.number().int().min(0).max(100),
});

export type UpdateMonthlyGoalGradeInput = z.infer<typeof UpdateMonthlyGoalGradeDTO>;
