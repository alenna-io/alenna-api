import { z } from 'zod';

// Input DTOs
export const CreateSchoolDTO = z.object({
  name: z.string().min(1, 'School name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export const UpdateSchoolDTO = CreateSchoolDTO.partial();

export type CreateSchoolInput = z.infer<typeof CreateSchoolDTO>;
export type UpdateSchoolInput = z.infer<typeof UpdateSchoolDTO>;

// Output DTOs
export interface SchoolOutput {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
  userCount?: number;
  studentCount?: number;
}

