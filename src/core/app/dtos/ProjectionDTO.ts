import { z } from 'zod';

// Input DTOs (from API)
export const CreateProjectionDTO = z.object({
  schoolYear: z.string().min(1, 'School year is required'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isActive: z.boolean().optional().default(true),
  notes: z.string().optional(),
});

export const UpdateProjectionDTO = CreateProjectionDTO.partial();

export type CreateProjectionInput = z.infer<typeof CreateProjectionDTO>;
export type UpdateProjectionInput = z.infer<typeof UpdateProjectionDTO>;

// Generate Projection DTO
export const GenerateProjectionDTO = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  schoolYear: z.string().min(1, 'School year is required'),
  subjects: z.array(z.object({
    subSubjectId: z.string().min(1, 'SubSubject ID is required'),
    subSubjectName: z.string().min(1, 'SubSubject name is required'),
    startPace: z.number().int().min(1, 'Start pace must be a positive integer'),
    endPace: z.number().int().min(1, 'End pace must be a positive integer'),
    skipPaces: z.array(z.number().int()).default([]),
    notPairWith: z.array(z.string()).default([]),
    groupedWith: z.array(z.string()).optional().default([]),
  })).min(1, 'At least one subject is required').max(6, 'Maximum 6 subjects allowed'),
});

// Output DTOs (to API)
export interface ProjectionOutput {
  id: string;
  studentId: string;
  schoolYear: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

