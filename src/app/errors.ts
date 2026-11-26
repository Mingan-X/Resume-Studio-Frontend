import type { App } from 'vue';
import { shallowRef } from 'vue';

import type { AppError } from '@/shared/api/errors';
import { normalizeError } from '@/shared/api/errors';

export const globalError = shallowRef<AppError | null>(null);
export function reportError(cause: unknown) {
  const error = normalizeError(cause);
  globalError.value = error;
  // 不记录message、原始异常、组件实例、URL或上下文，避免意外暴露用户数据。
  if (import.meta.env.DEV) console.error({ kind: error.kind, requestId: error.requestId });
}
export function installErrorHandlers(app: App) {
  app.config.errorHandler = reportError;
  const rejected = (event: PromiseRejectionEvent) => {
    event.preventDefault();
    reportError(event.reason);
  };
  window.addEventListener('unhandledrejection', rejected);
  app.onUnmount(() => window.removeEventListener('unhandledrejection', rejected));
}
