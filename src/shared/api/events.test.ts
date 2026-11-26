import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { subscribeEvents } from './events';

class TestSource extends EventTarget {
  static CLOSED = 2;
  static instances: TestSource[] = [];
  readyState = 0;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  close = vi.fn();
  constructor(readonly url: string) {
    super();
    TestSource.instances.push(this);
  }
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  TestSource.instances = [];
});
function setup() {
  vi.stubGlobal('EventSource', TestSource);
  vi.useFakeTimers();
  const onData = vi.fn(),
    onFallback = vi.fn(),
    onError = vi.fn();
  const stop = subscribeEvents('/events-probe', {
    schema: z.object({ count: z.number() }),
    onData,
    onFallback,
    onError,
  });
  const source = TestSource.instances[0];
  if (!source) throw new Error('missing source');
  return { source, stop, onData, onFallback, onError };
}
describe('SSE重连与回退', () => {
  it('交付已校验事件与id，重连保留同一原生连接', () => {
    const { source, onData, onFallback, stop } = setup();
    source.onmessage?.(new MessageEvent('message', { data: '{"count":2}', lastEventId: '7' }));
    expect(onData).toHaveBeenCalledWith({ count: 2 }, '7');
    source.onerror?.();
    source.onopen?.();
    vi.advanceTimersByTime(10000);
    expect(onFallback).not.toHaveBeenCalled();
    expect(TestSource.instances).toHaveLength(1);
    stop();
    expect(source.close).toHaveBeenCalledTimes(1);
  });
  it('连续错误达到上限后回退一次，停止后忽略事件', () => {
    const { source, onFallback, onData } = setup();
    source.onerror?.();
    source.onerror?.();
    source.onerror?.();
    source.onerror?.();
    source.onmessage?.(new MessageEvent('message', { data: '{"count":3}' }));
    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(onData).not.toHaveBeenCalled();
  });
  it('重连期限耗尽回退，主动停止取消计时', () => {
    const first = setup();
    first.source.onerror?.();
    vi.advanceTimersByTime(10000);
    expect(first.onFallback).toHaveBeenCalledOnce();
    const second = setup();
    second.source.onerror?.();
    second.stop();
    vi.advanceTimersByTime(10000);
    expect(second.onFallback).not.toHaveBeenCalled();
  });
  it.each(['not json', '{"count":"bad"}'])('非法事件%s报告契约错误并回退', (data) => {
    const { source, onError, onFallback } = setup();
    source.onmessage?.(new MessageEvent('message', { data }));
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ kind: 'contract' }));
    expect(onFallback).toHaveBeenCalledOnce();
  });
  it('不支持EventSource直接回退', () => {
    vi.stubGlobal('EventSource', undefined);
    const onFallback = vi.fn();
    subscribeEvents('/events-probe', { schema: z.object({}), onData: vi.fn(), onFallback })();
    expect(onFallback).toHaveBeenCalledOnce();
  });
});
