import { z } from 'zod';

export const GenerateProjectionDTO = z.object({
  studentId: z.string().min(1),
  schoolId: z.string().min(1),
  schoolYear: z.string().min(1),

  subjects: z.array(
    z.object({
      subSubjectId: z.string().min(1),

      startPace: z.number().int().min(1),
      endPace: z.number().int().min(1),

      // Explicit teacher knowledge
      skipPaces: z.array(z.number().int()).default([]),

      // Explicit exclusions only
      notPairWith: z.array(z.string()).default([]),

      // Explicit exclusions only
      difficulty: z.number().int().min(1).max(5).default(3).optional().nullable(),
    })
  )
    .min(1)
    .max(6),
});

export type GenerateProjectionInput = z.infer<typeof GenerateProjectionDTO>;