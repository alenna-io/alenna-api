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

