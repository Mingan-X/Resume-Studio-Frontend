import { describe, expect, it } from 'vitest';

import { healthSchema } from './health';

describe('临时健康契约', () => {
  it('忽略扩展字段，拒绝缺失或未知状态', () => {
    expect(
      healthSchema.parse({ status: 'ok', service: 'api', environment: 'test', extra: 1 }),
    ).toEqual({ status: 'ok', service: 'api', environment: 'test' });
    expect(healthSchema.safeParse({ status: 'ok' }).success).toBe(false);
    expect(
      healthSchema.safeParse({ status: 'wrong', service: 'api', environment: 'test' }).success,
    ).toBe(false);
  });
});
