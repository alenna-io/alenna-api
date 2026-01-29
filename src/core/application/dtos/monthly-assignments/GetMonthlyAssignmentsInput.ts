import { z } from 'zod';

export const GetMonthlyAssignmentsInputSchema = z.object({
  schoolYearId: z.string().min(1, 'School year ID is required'),
});

export type GetMonthlyAssignmentsInput = z.infer<typeof GetMonthlyAssignmentsInputSchema>;
