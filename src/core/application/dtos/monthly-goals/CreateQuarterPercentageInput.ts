import { z } from 'zod';

export const CreateQuarterPercentageDTO = z.object({
  quarter: z.string().regex(/^Q[1-5]$/, 'Quarter must be Q1, Q2, Q3, Q4, or Q5'),
  percentage: z.number().int().min(0).max(100, 'Percentage must be between 0 and 100'),
});

export type CreateQuarterPercentageInput = z.infer<typeof CreateQuarterPercentageDTO>;
