import { z } from 'zod';

export const UpdateGradeDTO = z.object({
  grade: z.number().min(0).max(100),
});

export type UpdateGradeInput = z.infer<typeof UpdateGradeDTO>;
