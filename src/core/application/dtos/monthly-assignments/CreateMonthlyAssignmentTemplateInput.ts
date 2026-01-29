import { z } from 'zod';

export const CreateMonthlyAssignmentTemplateDTO = z.object({
  name: z.string().min(1, 'Name is required'),
  quarter: z.string().regex(/^Q[1-4]$/, 'Quarter must be Q1, Q2, Q3, or Q4'),
});

export type CreateMonthlyAssignmentTemplateInput = z.infer<typeof CreateMonthlyAssignmentTemplateDTO>;
