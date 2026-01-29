import { z } from 'zod';

export const AddNoteInputSchema = z.object({
  notes: z.string().min(1, 'Note is required').max(50, 'Note must be 50 characters or less'),
});

export type AddNoteInput = z.infer<typeof AddNoteInputSchema>;
