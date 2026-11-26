import { z } from 'zod';

export const environmentSchema = z.object({
  VITE_APP_TITLE: z.string().min(1).default('Resume Studio'),
  VITE_ENABLE_MOCKS: z.enum(['true', 'false']).default('false'),
});
