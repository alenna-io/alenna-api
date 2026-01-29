import { z } from 'zod';

export const AddPaceDTO = z.object({
  paceCatalogId: z.string().min(1),
  quarter: z.string().min(1),
  week: z.number().int().min(1).max(9),
});

export type AddPaceInput = z.infer<typeof AddPaceDTO>;
