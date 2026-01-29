import { z } from 'zod';

export const UpdateMonthlyGoalTemplateDTO = z.object({
  name: z.string().min(1, 'Name is required'),
});

export type UpdateMonthlyGoalTemplateInput = z.infer<typeof UpdateMonthlyGoalTemplateDTO>;
