import { z } from 'zod';

export const CreateStudentBillingConfigDTO = z.object({
  requiresTaxableInvoice: z.boolean().default(false),
});

export type CreateStudentBillingConfigInput = z.infer<typeof CreateStudentBillingConfigDTO>;

export const UpdateStudentBillingConfigDTO = z.object({
  studentId: z.string().optional(),
  requiresTaxableInvoice: z.boolean().optional(),
});

export type UpdateStudentBillingConfigInput = z.infer<typeof UpdateStudentBillingConfigDTO>;

export const StudentBillingConfigOutputDTO = z.object({
  id: z.string(),
  studentId: z.string(),
  requiresTaxableInvoice: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});