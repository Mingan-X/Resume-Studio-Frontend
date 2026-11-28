import { z } from 'zod';

import type { AppError } from './errors';

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
const failureListeners = new Set<(error: AppError) => void>();
export function onAuthFailure(listener: (error: AppError) => void) {
  failureListeners.add(listener);
  return () => failureListeners.delete(listener);
}
export function notifyAuthFailure(error: AppError, path: string) {
  if (!path.startsWith('/auth/') && (error.status === 401 || error.status === 403))
    for (const listener of failureListeners) listener(error);
}
