import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { apiRequest, apiUrl } from './client';
import { AppError, normalizeError } from './errors';
import { setCsrf } from './sessionContext';

const schema = z.object({ value: z.string() });
const requestId = '00000000-0000-4000-8000-000000000001';
afterEach(() => vi.unstubAllGlobals());
function mockFetch() {
  const fetcher = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', fetcher);
  return fetcher;
}

describe('HTTP边界与重试', () => {
  it('CSRF仅附于写请求，GET不附头且不读取Cookie', async () => {
    setCsrf('a'.repeat(64));
    const fetcher = mockFetch().mockImplementation(async () => Response.json({ value: 'ok' }));
    try {
      await apiRequest('/sample', schema);
      expect(new Headers(fetcher.mock.calls[0]?.[1]?.headers).get('X-CSRF-Token')).toBeNull();
      await apiRequest('/sample', schema, { method: 'PATCH', body: {} });
      expect(new Headers(fetcher.mock.calls[1]?.[1]?.headers).get('X-CSRF-Token')).toBe(
        'a'.repeat(64),
      );
    } finally {
      setCsrf(undefined);
    }
  });
  it('解析数据、忽略未知字段并固定同源地址', async () => {
    const fetcher = mockFetch().mockResolvedValue(Response.json({ value: 'ok', extra: 1 }));
    expect(await apiRequest('/sample', schema)).toEqual({ value: 'ok' });
    expect(fetcher).toHaveBeenCalledWith(
      '/api/v1/sample',
      expect.objectContaining({ credentials: 'same-origin' }),
    );
    expect(apiUrl('/health')).toBe('/health');
    expect(() => apiUrl('https://external.test')).toThrow();
    expect(() => apiUrl('//external.test')).toThrow();
  });
  it('后端安全错误保留message、状态和响应头requestId', async () => {
    mockFetch().mockResolvedValue(
      Response.json(
        { code: 'NOT_FOUND', message: '不存在或无权访问', retryable: false, requestId },
        { status: 404, headers: { 'x-request-id': requestId } },
      ),
    );
    await expect(apiRequest('/sample', schema)).rejects.toMatchObject({
      kind: 'http',
      status: 404,
      code: 'NOT_FOUND',
      requestId,
      message: '不存在或无权访问',
    });
  });
  it('无合法错误体时不给用户内部HTML或堆栈', async () => {
    mockFetch().mockResolvedValue(
      new Response('<html>internal stack</html>', {
        status: 500,
        headers: { 'x-request-id': requestId },
      }),
    );
    await expect(apiRequest('/sample', schema)).rejects.toMatchObject({
      kind: 'http',
      message: '服务暂不可用，请稍后重试。',
      retryable: false,
      requestId,
    });
  });
  it('格式错误不重试', async () => {
    const fetcher = mockFetch().mockResolvedValue(
      Response.json({ other: true }, { headers: { 'x-request-id': requestId } }),
    );
    await expect(apiRequest('/sample', schema)).rejects.toMatchObject({
      kind: 'contract',
      requestId,
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('网络失败最多重试两次', async () => {
    const fetcher = mockFetch().mockRejectedValue(new TypeError('secret'));
    await expect(apiRequest('/sample', schema)).rejects.toMatchObject({
      kind: 'network',
      code: 'NETWORK_ERROR',
    });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it('超时与用户取消分开处理', async () => {
    mockFetch().mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('abort')), { once: true });
        }),
    );
    await expect(apiRequest('/sample', schema, { timeoutMs: 5, retries: 0 })).rejects.toMatchObject(
      { kind: 'network', code: 'TIMEOUT' },
    );
    const controller = new AbortController();
    const pending = apiRequest('/sample', schema, { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ kind: 'aborted', retryable: false });
    await expect(
      apiRequest('/sample', schema, { signal: controller.signal }),
    ).rejects.toMatchObject({ kind: 'aborted' });
  });
  it('变更无幂等键不重试；带键时失败后复用同一键和正文', async () => {
    const fetcher = mockFetch().mockRejectedValueOnce(new TypeError());
    await expect(apiRequest('/sample', schema, { method: 'POST', body: {} })).rejects.toMatchObject(
      { kind: 'network' },
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
    fetcher
      .mockReset()
      .mockRejectedValueOnce(new TypeError())
      .mockResolvedValueOnce(Response.json({ value: 'done' }));
    await expect(
      apiRequest('/sample', schema, {
        method: 'POST',
        body: { value: 1 },
        idempotencyKey: 'same-key',
      }),
    ).resolves.toEqual({ value: 'done' });
    for (const call of fetcher.mock.calls) {
      expect(new Headers(call[1]?.headers).get('Idempotency-Key')).toBe('same-key');
      expect(call[1]?.body).toBe('{"value":1}');
    }
  });
  it('只有后端retryable错误进入重试，退避中可以取消', async () => {
    const fetcher = mockFetch()
      .mockResolvedValueOnce(
        Response.json(
          { code: 'INTERNAL_ERROR', message: '稍后重试', retryable: true, requestId },
          { status: 503 },
        ),
      )
      .mockResolvedValueOnce(Response.json({ value: 'done' }));
    expect(await apiRequest('/sample', schema)).toEqual({ value: 'done' });
    fetcher.mockReset().mockRejectedValue(new TypeError());
    const controller = new AbortController();
    const pending = apiRequest('/sample', schema, { signal: controller.signal });
    await Promise.resolve();
    controller.abort();
    await expect(pending).rejects.toMatchObject({ kind: 'aborted' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('未知异常被替换为固定文案，AppError保留安全信息', () => {
    expect(normalizeError(new Error('secret')).message).not.toContain('secret');
    const error = new AppError({
      kind: 'http',
      code: 'NOT_FOUND',
      message: '安全文案',
      retryable: false,
    });
    expect(normalizeError(error)).toBe(error);
  });
});
