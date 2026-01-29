import { z } from 'zod';

export const UpdateMonthlyAssignmentTemplateDTO = z.object({
  name: z.string().min(1, 'Name is required'),
});

export type UpdateMonthlyAssignmentTemplateInput = z.infer<typeof UpdateMonthlyAssignmentTemplateDTO>;
