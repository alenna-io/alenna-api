import { z } from 'zod';

export const CreateCharacterTraitDTO = z.object({
  schoolYearId: z.string().min(1, 'School year ID is required'),
  month: z.number().int().min(1).max(12, 'Month must be between 1 and 12'),
  characterTrait: z.string().min(1, 'Character trait is required').max(30, 'Character trait must not exceed 30 characters'),
  verseText: z.string().min(1, 'Verse text is required').max(250, 'Verse text must not exceed 250 characters'),
  verseReference: z.string().min(1, 'Verse reference is required').max(50, 'Verse reference must not exceed 50 characters'),
});

export type CreateCharacterTraitInput = z.infer<typeof CreateCharacterTraitDTO>;

export const UpdateCharacterTraitDTO = z.object({
  schoolYearId: z.string().min(1, 'School year ID is required').optional(),
  month: z.number().int().min(1).max(12, 'Month must be between 1 and 12').optional(),
  characterTrait: z.string().min(1, 'Character trait is required').max(30, 'Character trait must not exceed 30 characters').optional(),
  verseText: z.string().min(1, 'Verse text is required').max(250, 'Verse text must not exceed 250 characters').optional(),
  verseReference: z.string().min(1, 'Verse reference is required').max(50, 'Verse reference must not exceed 50 characters').optional(),
});

export type UpdateCharacterTraitInput = z.infer<typeof UpdateCharacterTraitDTO>;

export const GetCharacterTraitsBySchoolYearDTO = z.object({
  schoolYearId: z.string().min(1, 'School year ID is required').optional(),
});

export type GetCharacterTraitsBySchoolYearInput = z.infer<typeof GetCharacterTraitsBySchoolYearDTO>;

export const GetCharacterTraitByMonthDTO = z.object({
  schoolYearId: z.string().min(1, 'School year ID is required'),
  month: z.coerce.number().int().min(1).max(12, 'Month must be between 1 and 12'),
});

export type GetCharacterTraitByMonthInput = z.infer<typeof GetCharacterTraitByMonthDTO>;

export interface CharacterTraitOutputDTO {
  id: string;
  schoolId: string;
  schoolYearId: string;
  month: number;
  characterTrait: string;
  verseText: string;
  verseReference: string;
  createdAt: Date;
  updatedAt: Date;
}

