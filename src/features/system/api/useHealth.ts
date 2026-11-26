import { useQuery } from '@tanstack/vue-query';

import { healthSchema } from '../model/health';

export const systemKeys = { health: ['system', 'health'] as const };

export function useHealth() {
  return useQuery({
    queryKey: systemKeys.health,
    retry: false,
    queryFn: async ({ signal }) => {
      // F1.2-T3接入共享HTTP客户端前，仅对接已实现的health契约。
      let response: Response;
      try {
        response = await fetch('/health', {
          credentials: 'same-origin',
          signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
        });
      } catch {
        throw new Error('网络连接失败，请确认后端服务已启动后重试。');
      }
      if (!response.ok) throw new Error('网络或服务暂不可用，请确认后端服务已启动后重试。');
      const body: unknown = await response.json().catch(() => null);
      const parsed = healthSchema.safeParse(body);
      if (!parsed.success) throw new Error('服务响应格式异常，请稍后重试。');
      return parsed.data;
    },
  });
}
