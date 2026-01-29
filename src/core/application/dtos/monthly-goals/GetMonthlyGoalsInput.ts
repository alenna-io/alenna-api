import { z } from 'zod';

export const GetMonthlyGoalsInputSchema = z.object({
  schoolYearId: z.string().min(1, 'School year ID is required'),
});

export type GetMonthlyGoalsInput = z.infer<typeof GetMonthlyGoalsInputSchema>;
