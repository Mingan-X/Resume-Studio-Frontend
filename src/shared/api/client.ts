import { z } from 'zod';

import { AppError, contractError, httpError, transportError } from './errors';
import { csrfHeaders, notifyAuthFailure } from './sessionContext';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal | undefined;
  idempotencyKey?: string;
  timeoutMs?: number;
  retries?: number;
  onRequestId?: (requestId: string | undefined) => void;
  headers?: Record<string, string>;
}
export function apiUrl(path: string): string {
  if (path === '/health') return path;
  if (!path.startsWith('/') || path.startsWith('//') || /[\\\s]/.test(path))
    throw new Error('Invalid API path');
  return `/api/v1${path}`;
}
export function canRetry(error: AppError, method: string, idempotencyKey?: string): boolean {
  return (
    error.retryable &&
    error.kind !== 'aborted' &&
    error.kind !== 'contract' &&
    (method === 'GET' || Boolean(idempotencyKey))
  );
}
function backoff(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(transportError(false, true));
      return;
    }
    const abort = () => {
      clearTimeout(timer);
      reject(transportError(false, true));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', abort, { once: true });
  });
}
export async function apiRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  const method = options.method ?? 'GET';
  const retries = Math.min(2, Math.max(0, options.retries ?? 2));
  const url = apiUrl(path);
  for (let attempt = 0; ; attempt++) {
    if (options.signal?.aborted) throw transportError(false, true);
    const timeout = AbortSignal.timeout(options.timeoutMs ?? 15000);
    const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
    try {
      const headers = new Headers({
        Accept: 'application/json',
        ...csrfHeaders(method),
        ...options.headers,
      });
      if (options.body !== undefined) headers.set('Content-Type', 'application/json');
      if (options.idempotencyKey) headers.set('Idempotency-Key', options.idempotencyKey);
      const response = await fetch(url, {
        method,
        credentials: 'same-origin',
        signal,
        headers,
        ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
      });
      const requestId = z
        .uuid()
        .optional()
        .catch(undefined)
        .parse(response.headers.get('x-request-id'));
      options.onRequestId?.(requestId);
      const body: unknown = await response.json().catch(() => null);
      if (signal.aborted) throw transportError(timeout.aborted, options.signal?.aborted ?? false);
      if (!response.ok) {
        const error = httpError(body, response.status, requestId);
        notifyAuthFailure(error, path);
        throw error;
      }
      const parsed = schema.safeParse(body);
      if (!parsed.success) throw contractError(requestId);
      return parsed.data;
    } catch (cause) {
      const error =
        cause instanceof AppError
          ? cause
          : transportError(timeout.aborted, options.signal?.aborted ?? false);
      if (attempt >= retries || !canRetry(error, method, options.idempotencyKey)) throw error;
      await backoff(500 * 2 ** attempt, options.signal);
    }
  }
}
