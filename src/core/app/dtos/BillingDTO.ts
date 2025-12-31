import { z } from 'zod';

export const CreateBillingRecordDTO = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  schoolYearId: z.string().min(1, 'School year ID is required'),
  billingMonth: z.number().int().min(1).max(12, 'Billing month must be between 1 and 12'),
  billingYear: z.number().int().min(2020).max(2100, 'Billing year must be between 2020 and 2100'),
  baseAmount: z.number().nonnegative('Base amount cannot be negative').optional(),
});

export type CreateBillingRecordInput = z.infer<typeof CreateBillingRecordDTO>;

export const BulkCreateBillingRecordsDTO = z.object({
  schoolYearId: z.string().min(1, 'School year ID is required'),
  billingMonth: z.number().int().min(1).max(12, 'Billing month must be between 1 and 12'),
  billingYear: z.number().int().min(2020).max(2100, 'Billing year must be between 2020 and 2100'),
  studentIds: z.array(z.string()).optional(),
});

export type BulkCreateBillingRecordsInput = z.infer<typeof BulkCreateBillingRecordsDTO>;

export const DiscountAdjustmentDTO = z.object({
  type: z.enum(['percentage', 'fixed']),
  value: z.number().nonnegative('Value cannot be negative'),
  description: z.string().optional(),
});

export const ExtraChargeDTO = z.object({
  amount: z.number().nonnegative('Amount cannot be negative'),
  description: z.string().optional(),
});

export const UpdateBillingRecordDTO = z.object({
  billStatus: z.enum(['required', 'sent', 'not_required', 'cancelled']).optional(),
  effectiveTuitionAmount: z.number().nonnegative('Effective tuition amount cannot be negative').optional(),
  discountAdjustments: z.array(DiscountAdjustmentDTO).optional(),
  extraCharges: z.array(ExtraChargeDTO).optional(),
  paymentNote: z.string().optional(),
});

export type UpdateBillingRecordInput = z.infer<typeof UpdateBillingRecordDTO>;

export const RecordManualPaymentDTO = z.object({
  paymentMethod: z.enum(['manual', 'online', 'other']),
  paymentNote: z.string().optional(),
});

export type RecordManualPaymentInput = z.infer<typeof RecordManualPaymentDTO>;

export const ApplyLateFeeDTO = z.object({
  lateFeeAmount: z.number().nonnegative('Late fee amount cannot be negative').optional(),
});

export type ApplyLateFeeInput = z.infer<typeof ApplyLateFeeDTO>;

export const BulkApplyLateFeeDTO = z.object({
  billingRecordIds: z.array(z.string()).optional(),
  dueDate: z.string().datetime().optional(),
});

export type BulkApplyLateFeeInput = z.infer<typeof BulkApplyLateFeeDTO>;

export const CreateTuitionConfigDTO = z.object({
  dueDay: z.number().int().min(1).max(31, 'Due day must be between 1 and 31').default(5),
});

export type CreateTuitionConfigInput = z.infer<typeof CreateTuitionConfigDTO>;

export const UpdateTuitionConfigDTO = CreateTuitionConfigDTO.partial();

export type UpdateTuitionConfigInput = z.infer<typeof UpdateTuitionConfigDTO>;

export const CreateStudentScholarshipDTO = z.object({
  tuitionTypeId: z.string().optional().nullable(),
  scholarshipType: z.enum(['percentage', 'fixed']).optional().nullable(),
  scholarshipValue: z.number().nonnegative('Scholarship value cannot be negative').optional().nullable(),
});

export type CreateStudentScholarshipInput = z.infer<typeof CreateStudentScholarshipDTO>;

export const UpdateStudentScholarshipDTO = CreateStudentScholarshipDTO.partial();

export type UpdateStudentScholarshipInput = z.infer<typeof UpdateStudentScholarshipDTO>;

export const GetBillingRecordsDTO = z.object({
  studentId: z.string().optional(),
  schoolYearId: z.string().optional(),
  billingMonth: z.number().int().min(1).max(12).optional(),
  billingYear: z.number().int().min(2020).max(2100).optional(),
  billStatus: z.enum(['required', 'sent', 'not_required', 'cancelled']).optional(),
  paymentStatus: z.enum(['unpaid', 'paid']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type GetBillingRecordsInput = z.infer<typeof GetBillingRecordsDTO>;

export const GetBillingMetricsDTO = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  schoolYearId: z.string().optional(),
});

export type GetBillingMetricsInput = z.infer<typeof GetBillingMetricsDTO>;

export const GetBillingDashboardDTO = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  schoolYearId: z.string().optional(),
  includeAll: z.boolean().optional().default(false),
});

export type GetBillingDashboardInput = z.infer<typeof GetBillingDashboardDTO>;

export const CreateTuitionTypeDTO = z.object({
  name: z.string().min(1, 'Name is required'),
  baseAmount: z.number().nonnegative('Base amount cannot be negative'),
  currency: z.string().default('USD'),
  lateFeeType: z.enum(['fixed', 'percentage']),
  lateFeeValue: z.number().nonnegative('Late fee value cannot be negative'),
  displayOrder: z.number().int().default(0),
});

export type CreateTuitionTypeInput = z.infer<typeof CreateTuitionTypeDTO>;

export const UpdateTuitionTypeDTO = CreateTuitionTypeDTO.partial();

export type UpdateTuitionTypeInput = z.infer<typeof UpdateTuitionTypeDTO>;

