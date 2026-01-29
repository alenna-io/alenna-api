import { z } from 'zod';
import { validateDailyGoalText } from '../../../domain/utils/daily-goal-validation';

export const CreateDailyGoalInputSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  quarter: z.string().regex(/^Q[1-4]$/, 'Quarter must be Q1, Q2, Q3, or Q4'),
  week: z.number().int().min(1).max(9, 'Week must be between 1 and 9'),
  dayOfWeek: z.number().int().min(1).max(5, 'Day of week must be between 1 and 5'),
  text: z.string().min(1, 'Text is required').refine(
    (text) => {
      const result = validateDailyGoalText(text);
      return result.valid;
    },
    (text) => {
      const result = validateDailyGoalText(text);
      return { message: result.error || 'Invalid daily goal text format' };
    }
  ),
});

export type CreateDailyGoalInput = z.infer<typeof CreateDailyGoalInputSchema>;
