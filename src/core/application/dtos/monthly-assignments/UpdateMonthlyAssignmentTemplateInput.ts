import { z } from 'zod';

export const UpdateMonthlyAssignmentTemplateDTO = z.object({
  name: z.string().min(1, 'Name is required'),
  month: z.number().int().min(1).max(12, 'Month must be between 1 and 12'),
});

export type UpdateMonthlyAssignmentTemplateInput = z.infer<typeof UpdateMonthlyAssignmentTemplateDTO>;
