import { z } from 'zod';

// Input DTOs (from API)
export const CreateStudentDTO = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  birthDate: z.string().datetime(),
  certificationTypeId: z.string().min(1, 'Certification type is required'),
  graduationDate: z.string().datetime(),
  contactPhone: z.string().optional(),
  isLeveled: z.boolean().optional().default(false),
  expectedLevel: z.string().optional(),
  currentLevel: z.string().optional(),
  address: z.string().optional(),
});

export const UpdateStudentDTO = CreateStudentDTO.partial();

export type CreateStudentInput = z.infer<typeof CreateStudentDTO>;
export type UpdateStudentInput = z.infer<typeof UpdateStudentDTO>;

// Output DTOs (to API)
export interface StudentOutput {
  id: string;
  firstName: string;
  lastName: string;
  name: string; // Full name
  age: number;
  birthDate: string;
  certificationType: string;
  graduationDate: string;
  contactPhone?: string;
  isLeveled: boolean;
  expectedLevel?: string;
  currentLevel?: string;
  address?: string;
  parents: Array<{ id: string; name: string }>;
  createdAt?: string;
  updatedAt?: string;
}

