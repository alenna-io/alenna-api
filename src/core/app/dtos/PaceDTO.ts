// DTOs for Pace and related data

import { z } from 'zod';

// Input DTO for adding a PACE to a projection
export const AddPaceToProjectionDTO = z.object({
  paceCatalogId: z.string().min(1, 'PACE catalog ID is required'),
  quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']),
  week: z.number().int().min(1).max(9),
});

export type AddPaceToProjectionInput = z.infer<typeof AddPaceToProjectionDTO>;

// Input DTO for updating a PACE grade
export const UpdatePaceGradeDTO = z.object({
  grade: z.number().int().min(0).max(100),
  isCompleted: z.boolean().optional(),
  isFailed: z.boolean().optional(),
  comments: z.string().optional(),
  note: z.string().optional(), // Note for grade history
});

export type UpdatePaceGradeInput = z.infer<typeof UpdatePaceGradeDTO>;

// Input DTO for moving a PACE to a different week/quarter
export const MovePaceDTO = z.object({
  quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']),
  week: z.number().int().min(1).max(9),
});

export type MovePaceInput = z.infer<typeof MovePaceDTO>;

export interface GradeHistoryOutput {
  id: string;
  grade: number;
  date: string; // ISO date string
  note?: string;
}

export interface PaceOutput {
  id: string;
  paceCatalogId: string; // Added to identify which pace from catalog
  number: string;
  subject: string; // Sub-subject name
  category: string; // Category name
  quarter: string;
  week: number;
  grade: number | null;
  isCompleted: boolean;
  isFailed: boolean;
  isUnfinished?: boolean;
  originalQuarter?: string;
  originalWeek?: number;
  comments?: string;
  gradeHistory: GradeHistoryOutput[];
  createdAt: string;
  updatedAt: string;
}

// Organized pace data by quarter, subject, and week
export interface QuarterPacesOutput {
  [subject: string]: (PaceOutput | null)[]; // Array indexed by week (0-8 for weeks 1-9)
}

export interface StudentInfoOutput {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  age: number;
  currentLevel?: string;
  certificationType: string;
}

export interface ProjectionDetailOutput {
  id: string;
  studentId: string;
  student: StudentInfoOutput;
  schoolYear: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  categories?: string[]; // Category names used in this projection
  quarters: {
    Q1: QuarterPacesOutput;
    Q2: QuarterPacesOutput;
    Q3: QuarterPacesOutput;
    Q4: QuarterPacesOutput;
  };
}

