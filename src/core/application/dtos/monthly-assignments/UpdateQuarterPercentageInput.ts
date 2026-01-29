import { z } from 'zod';

export const UpdateQuarterPercentageDTO = z.object({
  percentage: z.number().int().min(0).max(100, 'Percentage must be between 0 and 100'),
});

export type UpdateQuarterPercentageInput = z.infer<typeof UpdateQuarterPercentageDTO>;
