import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { uploadRequest } from './upload';

class TestXHR {
  static current: TestXHR;
  status = 200;
  responseText = '{"ok":true}';
  timeout = 0;
  upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  onabort: (() => void) | null = null;
  open = vi.fn();
  setRequestHeader = vi.fn();
  send = vi.fn();
  abort = () => this.onabort?.();
  getResponseHeader = () => '00000000-0000-4000-8000-000000000001';
  constructor() {
    TestXHR.current = this;
  }
}
afterEach(() => vi.unstubAllGlobals());
function start(signal?: AbortSignal) {
  vi.stubGlobal('XMLHttpRequest', TestXHR);
  const onProgress = vi.fn();
  const body = new FormData();
  body.append('file', new Blob(['synthetic']), 'fixture.txt');
  const pending = uploadRequest('/transport-probe', body, z.object({ ok: z.boolean() }), {
    idempotencyKey: 'stable-key',
    onProgress,
    ...(signal ? { signal } : {}),
  });
  return { pending, xhr: TestXHR.current, onProgress, body };
}
describe('上传传输边界', () => {
  it('进度使用浏览器字节数，不手写Content-Type', async () => {
    const { xhr, pending, onProgress, body } = start();
    xhr.upload.onprogress?.(
      new ProgressEvent('progress', { loaded: 3, total: 8, lengthComputable: true }),
    );
    xhr.upload.onprogress?.(new ProgressEvent('progress', { loaded: 4 }));
    expect(onProgress.mock.calls).toEqual([
      [3, 8],
      [4, null],
    ]);
    expect(xhr.send).toHaveBeenCalledWith(body);
    expect(xhr.setRequestHeader).toHaveBeenCalledWith('Idempotency-Key', 'stable-key');
    expect(xhr.setRequestHeader).not.toHaveBeenCalledWith('Content-Type', expect.anything());
    xhr.onload?.();
    await expect(pending).resolves.toEqual({ ok: true });
  });
  it('取消不重试且开始前的取消不发送', async () => {
    const controller = new AbortController();
    const { pending, xhr } = start(controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ kind: 'aborted', retryable: false });
    expect(xhr.send).toHaveBeenCalledOnce();
    await expect(start(controller.signal).pending).rejects.toMatchObject({ kind: 'aborted' });
  });
  it.each(['network', 'timeout', 'http', 'contract', 'json'])(
    '%s转换安全AppError',
    async (kind) => {
      const { pending, xhr } = start();
      if (kind === 'network') xhr.onerror?.();
      else if (kind === 'timeout') xhr.ontimeout?.();
      else {
        xhr.status = kind === 'http' ? 413 : 200;
        xhr.responseText = kind === 'json' ? 'invalid' : '{}';
        xhr.onload?.();
      }
      await expect(pending).rejects.toMatchObject({
        kind:
          kind === 'http' ? 'http' : ['contract', 'json'].includes(kind) ? 'contract' : 'network',
      });
    },
  );
});
