import { z } from 'zod';

export const GetProjectionListOutputSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  schoolYear: z.string(),
  status: z.enum(['OPEN', 'CLOSED']),
  totalPaces: z.number().int().min(0),
  student: z.object({
    id: z.string(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type GetProjectionListOutput = z.infer<typeof GetProjectionListOutputSchema>;
