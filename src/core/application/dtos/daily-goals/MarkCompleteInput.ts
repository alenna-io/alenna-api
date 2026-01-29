import { z } from 'zod';

export const MarkCompleteInputSchema = z.object({
  isCompleted: z.boolean(),
});

export type MarkCompleteInput = z.infer<typeof MarkCompleteInputSchema>;
