import { z } from 'zod';

// ============= INPUT DTOs =============

export const CreateSchoolYearInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isActive: z.boolean().optional().default(false),
  quarters: z.array(z.object({
    name: z.string().min(1, 'Quarter name is required'),
    displayName: z.string().min(1, 'Display name is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    order: z.number().int().min(1).max(4),
    weeksCount: z.number().int().min(1).max(12).optional().default(9),
  })).length(4, 'Must have exactly 4 quarters'),
});

export type CreateSchoolYearInput = z.infer<typeof CreateSchoolYearInputSchema>;

export const UpdateSchoolYearInputSchema = z.object({
  name: z.string().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
  quarters: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1).optional(),
    displayName: z.string().min(1).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    order: z.number().int().min(1).max(4).optional(),
    weeksCount: z.number().int().min(1).max(12).optional(),
  })).optional(),
});

export type UpdateSchoolYearInput = z.infer<typeof UpdateSchoolYearInputSchema>;

// ============= OUTPUT DTOs =============

export interface QuarterOutput {
  id: string;
  schoolYearId: string;
  name: string;
  displayName: string;
  startDate: string;
  endDate: string;
  order: number;
  weeksCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolYearOutput {
  id: string;
  schoolId: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  quarters?: QuarterOutput[];
  createdAt: string;
  updatedAt: string;
}

export interface CurrentWeekOutput {
  schoolYear: SchoolYearOutput;
  currentQuarter: QuarterOutput | null;
  currentWeek: number | null; // 1-9 within the quarter
  weekStartDate: string | null;
  weekEndDate: string | null;
}

