import { describe, expect, it } from 'vitest';

import { isTerminal, retryTime, stageLabel, statusLabels } from './task';

describe('任务状态展示', () => {
  it.each(['SUCCEEDED', 'PARTIAL', 'FAILED', 'CANCELLED'] as const)('%s属于终态', (status) =>
    expect(isTerminal(status)).toBe(true),
  );
  it.each(['QUEUED', 'RUNNING', 'RETRY_WAIT'] as const)('%s继续等待后端', (status) =>
    expect(isTerminal(status)).toBe(false),
  );
  it('未知阶段保留后端值，不估算进度', () => {
    expect(isTerminal()).toBe(false);
    expect(stageLabel('QUEUED')).toBe('等待处理');
    expect(stageLabel('FUTURE_STAGE')).toBe('FUTURE_STAGE');
    expect(statusLabels.RETRY_WAIT).toBe('等待重试');
    expect(retryTime('2026-11-27T00:00:00.000Z')).toContain('2026');
  });
});
