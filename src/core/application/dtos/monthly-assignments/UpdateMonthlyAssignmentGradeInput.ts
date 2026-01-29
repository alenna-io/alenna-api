import { z } from 'zod';

export const UpdateMonthlyAssignmentGradeDTO = z.object({
  grade: z.number().int().min(0).max(100),
});

export type UpdateMonthlyAssignmentGradeInput = z.infer<typeof UpdateMonthlyAssignmentGradeDTO>;
