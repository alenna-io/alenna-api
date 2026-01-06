import { z } from 'zod';

export const CreateProjectionDTO = z.object({
  studentId: z.string().min(1),
  schoolId: z.string().min(1),
  schoolYear: z.string().min(1),
});

export type CreateProjectionInput = z.infer<typeof CreateProjectionDTO>;