import { z } from 'zod';

export const CreateRecurringExtraChargeDTO = z.object({
  description: z.string().min(1, 'Description is required').max(100, 'Description cannot exceed 100 characters'),
  amount: z.number().positive('Amount must be positive'),
  expiresAt: z.string().datetime('Invalid expiration date format'),
});

export type CreateRecurringExtraChargeInput = z.infer<typeof CreateRecurringExtraChargeDTO>;

export const UpdateRecurringExtraChargeDTO = z.object({
  description: z.string().min(1, 'Description is required').max(100, 'Description cannot exceed 100 characters').optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  expiresAt: z.string().datetime('Invalid expiration date format').optional(),
});

export type UpdateRecurringExtraChargeInput = z.infer<typeof UpdateRecurringExtraChargeDTO>;

export const RecurringExtraChargeOutputDTO = z.object({
  id: z.string(),
  studentId: z.string(),
  description: z.string(),
  amount: z.number(),
  expiresAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type RecurringExtraChargeOutput = z.infer<typeof RecurringExtraChargeOutputDTO>;

