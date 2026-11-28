import { z } from 'zod';

import { apiUrl } from './client';
import type { AppError } from './errors';
import { contractError } from './errors';

export interface EventOptions<T> {
  schema: z.ZodType<T>;
  onData: (data: T, eventId: string) => void;
  onFallback: () => void;
  onError?: (error: AppError) => void;
  maxFailures?: number;
  reconnectDeadlineMs?: number;
  eventName?: string;
}
export function subscribeEvents<T>(path: string, options: EventOptions<T>): () => void {
  let source: EventSource;
  let failures = 0;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const stop = () => {
    stopped = true;
    clearTimeout(timer);
    source?.close();
  };
  const fallback = () => {
    if (stopped) return;
    stop();
    options.onFallback();
  };
  try {
    source = new EventSource(apiUrl(path));
  } catch {
    fallback();
    return stop;
  }
  source.onopen = () => {
    failures = 0;
    clearTimeout(timer);
    timer = undefined;
  };
  const handleMessage = (event: MessageEvent) => {
    if (stopped) return;
    let value: unknown;
    try {
      value = JSON.parse(z.string().parse(event.data));
    } catch {
      options.onError?.(contractError());
      fallback();
      return;
    }
    const parsed = options.schema.safeParse(value);
    if (!parsed.success) {
      options.onError?.(contractError());
      fallback();
      return;
    }
    options.onData(parsed.data, z.string().parse(event.lastEventId));
  };
  if (options.eventName)
    source.addEventListener(options.eventName, (event) => {
      if (event instanceof MessageEvent) handleMessage(event);
    });
  else source.onmessage = handleMessage;
  source.onerror = () => {
    if (stopped) return;
    failures++;
    if (failures >= (options.maxFailures ?? 3) || source.readyState === EventSource.CLOSED) {
      fallback();
      return;
    }
    // 保留原EventSource，让浏览器自动重连并发送Last-Event-ID。
    timer ??= setTimeout(fallback, options.reconnectDeadlineMs ?? 10000);
  };
  return stop;
}
