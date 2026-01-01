import { z } from 'zod';

export const CreateSubSubjectDTO = z.object({
  name: z.string().min(1, 'Name is required'),
  categoryId: z.string().min(1, 'Category ID is required'),
  levelId: z.string().min(1, 'Level ID is required'),
  startPace: z.number().int().min(1, 'Start pace must be a positive integer'),
  endPace: z.number().int().min(1, 'End pace must be a positive integer'),
  difficulty: z.number().int().min(1).max(5).optional().default(3),
});

export type CreateSubSubjectInput = z.infer<typeof CreateSubSubjectDTO>;

