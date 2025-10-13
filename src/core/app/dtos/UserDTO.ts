import { z } from 'zod';

// Input DTOs
export const SyncUserDTO = z.object({
  clerkId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  schoolId: z.string().optional(),
});

export const UpdateUserDTO = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['ADMIN', 'TEACHER', 'SUPERVISOR']).optional(),
});

export type SyncUserInput = z.infer<typeof SyncUserDTO>;
export type UpdateUserInput = z.infer<typeof UpdateUserDTO>;

// Output DTOs
export interface UserOutput {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  schoolId: string;
  school?: {
    id: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

