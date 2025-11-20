import { z } from 'zod';

// Input DTOs
export const SyncUserDTO = z.object({
  clerkId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  schoolId: z.string().optional(),
});

export const CreateUserDTO = z.object({
  clerkId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  schoolId: z.string().min(1),
  roleIds: z.array(z.string()).min(1, 'At least one role must be assigned'),
});

export const UpdateUserDTO = z.object({
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  language: z.enum(['es', 'en']).optional(),
  schoolId: z.string().optional(),
  roleIds: z.array(z.string()).optional(),
});

export type SyncUserInput = z.infer<typeof SyncUserDTO>;
export type CreateUserInput = z.infer<typeof CreateUserDTO>;
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

