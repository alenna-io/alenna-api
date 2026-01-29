import { z } from 'zod';

export const CreateMonthlyGoalTemplateDTO = z.object({
  name: z.string().min(1, 'Name is required'),
  quarter: z.string().regex(/^Q[1-5]$/, 'Quarter must be Q1, Q2, Q3, Q4, or Q5'),
});

export type CreateMonthlyGoalTemplateInput = z.infer<typeof CreateMonthlyGoalTemplateDTO>;
