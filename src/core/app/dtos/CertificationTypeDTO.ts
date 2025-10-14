import { z } from 'zod';

// Input DTOs (from API)
export const CreateCertificationTypeDTO = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const UpdateCertificationTypeDTO = CreateCertificationTypeDTO.partial();

export type CreateCertificationTypeInput = z.infer<typeof CreateCertificationTypeDTO>;
export type UpdateCertificationTypeInput = z.infer<typeof UpdateCertificationTypeDTO>;

// Output DTOs (to API)
export interface CertificationTypeOutput {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

