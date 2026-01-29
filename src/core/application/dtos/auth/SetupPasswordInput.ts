import { z } from 'zod';

export const SetupPasswordDTO = z.object({
  password: z.string().min(12),
});

export type SetupPasswordInput = z.infer<typeof SetupPasswordDTO>;
