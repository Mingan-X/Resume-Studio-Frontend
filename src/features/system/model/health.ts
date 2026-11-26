import { z } from 'zod';

// 临时契约来源：后端src/contracts/http.ts；F1.3切换生成类型。
export const healthSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('api'),
  environment: z.enum(['development', 'test', 'production']),
});
export type Health = z.infer<typeof healthSchema>;
