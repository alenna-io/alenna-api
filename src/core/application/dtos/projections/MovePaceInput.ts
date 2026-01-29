import { z } from 'zod';

export const MovePaceDTO = z.object({
  quarter: z.string().min(1),
  week: z.number().int().min(1).max(9),
});

export type MovePaceInput = z.infer<typeof MovePaceDTO>;
