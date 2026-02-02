import { z } from 'zod';

export const AddSubjectDTO = z.object({
  subjectId: z.string().min(1),
});

export type AddSubjectInput = z.infer<typeof AddSubjectDTO>;
