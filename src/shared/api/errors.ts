import { z } from 'zod';

import { zErrorResponse } from '@/generated/zod.gen';

// 后端允许兼容新增错误码；结构来自生成Schema，未知code走通用处理。
const errorBodySchema = zErrorResponse.extend({ code: z.string() });
export type ErrorKind = 'http' | 'network' | 'contract' | 'aborted';
export interface ErrorOptions {
  kind: ErrorKind;
  code: string;
  message: string;
  retryable: boolean;
  requestId?: string | undefined;
  status?: number | undefined;
}
export class AppError extends Error {
  readonly kind: ErrorKind;
  readonly code: string;
  readonly retryable: boolean;
  readonly requestId: string | undefined;
  readonly status: number | undefined;
  constructor(options: ErrorOptions) {
    super(options.message);
    this.name = 'AppError';
    this.kind = options.kind;
    this.code = options.code;
    this.retryable = options.retryable;
    this.requestId = options.requestId;
    this.status = options.status;
  }
}
export function httpError(body: unknown, status: number, requestId?: string | null): AppError {
  const parsed = errorBodySchema.safeParse(body);
  return new AppError({
    kind: 'http',
    code: parsed.success ? parsed.data.code : 'INTERNAL_ERROR',
    message: parsed.success ? parsed.data.message : '服务暂不可用，请稍后重试。',
    retryable: parsed.success && parsed.data.retryable,
    requestId: requestId || (parsed.success ? parsed.data.requestId : undefined),
    status,
  });
}
export function transportError(timedOut: boolean, aborted: boolean): AppError {
  if (aborted)
    return new AppError({
      kind: 'aborted',
      code: 'ABORTED',
      message: '请求已取消。',
      retryable: false,
    });
  return new AppError({
    kind: 'network',
    code: timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
    message: timedOut ? '请求超时，请重试。' : '网络连接失败，请确认后端服务已启动后重试。',
    retryable: true,
  });
}
export function contractError(requestId?: string | null): AppError {
  return new AppError({
    kind: 'contract',
    code: 'CONTRACT_ERROR',
    message: '服务响应格式异常，请稍后重试。',
    retryable: false,
    requestId: requestId ?? undefined,
  });
}
export function normalizeError(error: unknown): AppError {
  return error instanceof AppError
    ? error
    : new AppError({
        kind: 'contract',
        code: 'UNEXPECTED_ERROR',
        message: '页面暂时无法完成操作，请重试。',
        retryable: false,
      });
}
