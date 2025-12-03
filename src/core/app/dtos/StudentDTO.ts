import { z } from 'zod';

// Input DTOs (from API)
export const CreateStudentDTO = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid student email is required'),
  birthDate: z.string().datetime(),
  certificationTypeId: z.string().min(1, 'Certification type is required'),
  graduationDate: z.string().datetime(),
  contactPhone: z.string().optional(),
  isLeveled: z.boolean().optional().default(false),
  expectedLevel: z.string().optional(),
  currentLevel: z.string().optional(),
  address: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  parents: z.array(z.object({
    firstName: z.string().min(1, 'Parent first name is required'),
    lastName: z.string().min(1, 'Parent last name is required'),
    email: z.string().email('Invalid parent email'),
    phone: z.string().min(1, 'Parent phone number is required'),
    relationship: z.string().min(1, 'Relationship is required'),
  })).min(1, 'At least one parent is required').max(2, 'Maximum two parents allowed'),
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
  streetAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  parents: Array<{ id: string; name: string }>;
  createdAt?: string;
  updatedAt?: string;
}

