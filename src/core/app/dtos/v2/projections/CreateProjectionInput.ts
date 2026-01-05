// frameworks/api/dtos/projections/v2/CreateProjectionDTO.ts
import { z } from 'zod';

export const CreateProjectionDTO = z.object({
  studentId: z.string().min(1),
  schoolId: z.string().min(1),
  schoolYear: z.string().min(1),
});

export type CreateProjectionInput = {
  studentId: string;
  schoolId: string;
  schoolYear: string;
};

export type CreateProjectionInputType = z.infer<typeof CreateProjectionDTO>;