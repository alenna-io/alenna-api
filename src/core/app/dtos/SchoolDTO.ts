import { z } from 'zod';

// Input DTOs
export const CreateSchoolDTO = z.object({
  name: z.string().min(1, 'School name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  teacherLimit: z.number().int().positive().optional(),
  userLimit: z.number().int().positive().optional(),
  moduleIds: z.array(z.string()).optional(), // Optional array of module IDs to enable
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
  logoUrl?: string;
  teacherLimit?: number;
  userLimit?: number;
  createdAt?: string;
  updatedAt?: string;
  userCount?: number;
  studentCount?: number;
}

