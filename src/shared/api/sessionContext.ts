import { z } from 'zod';

// 仅CSRF请求证明保留于进程内存；认证Cookie始终由浏览器处理，不读取/持久化。
let csrf: string | undefined;
export function setCsrf(value: unknown) {
  csrf = z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .optional()
    .parse(value);
}
export function csrfHeaders(method: string): Record<string, string> {
  return method !== 'GET' && method !== 'HEAD' && csrf ? { 'X-CSRF-Token': csrf } : {};
}
