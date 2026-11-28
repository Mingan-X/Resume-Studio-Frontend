import type { z } from 'zod';

import { apiUrl } from './client';
import { contractError, httpError, transportError } from './errors';
import { csrfHeaders, notifyAuthFailure } from './sessionContext';

export interface UploadOptions {
  signal?: AbortSignal;
  idempotencyKey: string;
  timeoutMs?: number;
  onProgress?: (loaded: number, total: number | null) => void;
}
export function uploadRequest<T>(
  path: string,
  body: FormData,
  schema: z.ZodType<T>,
  options: UploadOptions,
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (options.signal?.aborted) {
      reject(transportError(false, true));
      return;
    }
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    const cleanup = () => options.signal?.removeEventListener('abort', abort);
    xhr.open('POST', apiUrl(path));
    xhr.timeout = options.timeoutMs ?? 60000;
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Idempotency-Key', options.idempotencyKey);
    for (const [name, value] of Object.entries(csrfHeaders('POST')))
      xhr.setRequestHeader(name, value);
    // FormData的multipart边界交给浏览器；同源Cookie由XHR自动携带。
    xhr.upload.onprogress = (event) =>
      options.onProgress?.(event.loaded, event.lengthComputable ? event.total : null);
    xhr.onload = () => {
      cleanup();
      const requestId = xhr.getResponseHeader('x-request-id');
      let value: unknown;
      try {
        value = JSON.parse(xhr.responseText);
      } catch {
        value = null;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        const error = httpError(value, xhr.status, requestId);
        notifyAuthFailure(error, path);
        reject(error);
        return;
      }
      const result = schema.safeParse(value);
      if (!result.success) {
        reject(contractError(requestId));
        return;
      }
      resolve(result.data);
    };
    xhr.onerror = () => {
      cleanup();
      reject(transportError(false, false));
    };
    xhr.ontimeout = () => {
      cleanup();
      reject(transportError(true, false));
    };
    xhr.onabort = () => {
      cleanup();
      reject(transportError(false, true));
    };
    options.signal?.addEventListener('abort', abort, { once: true });
    try {
      xhr.send(body);
    } catch {
      cleanup();
      reject(transportError(false, false));
    }
  });
}
