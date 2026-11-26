import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import type { z } from 'zod';

import type { HealthResponse, TaskResponse } from '../../src/generated/types.gen';
import { zCancelTaskResponse, zHealthResponse, zTaskResponse } from '../../src/generated/zod.gen';
import { apiRequest } from '../../src/shared/api/client';
import { cancelResponse, queuedTask, retryTask, terminalTasks } from '../mocks/fixtures/tasks';
import { healthyResponse } from '../mocks/handlers';

describe('前后端契约', () => {
  it('夹具与生成类型和运行时Schema一致', () => {
    expectTypeOf<z.infer<typeof zHealthResponse>>().toEqualTypeOf<HealthResponse>();
    expectTypeOf<z.infer<typeof zTaskResponse>>().toEqualTypeOf<TaskResponse>();
    expect(zHealthResponse.parse(healthyResponse)).toEqual(healthyResponse);
    for (const task of [queuedTask, retryTask, ...terminalTasks])
      expect(zTaskResponse.parse(task)).toEqual(task);
    expect(zCancelTaskResponse.parse(cancelResponse)).toEqual(cancelResponse);
  });
  it('缺字段、错误类型与JOB_INDEX非法PARTIAL都拒绝', () => {
    expect(zTaskResponse.safeParse({ taskId: queuedTask.taskId }).success).toBe(false);
    expect(
      zTaskResponse.safeParse({ ...queuedTask, progress: { completed: '1', total: 2 } }).success,
    ).toBe(false);
    expect(
      zTaskResponse.safeParse({ ...queuedTask, taskType: 'JOB_INDEX', status: 'PARTIAL' }).success,
    ).toBe(false);
    expect(
      zCancelTaskResponse.safeParse({ ...cancelResponse, cancelRequested: false }).success,
    ).toBe(false);
  });
  it('顶层与嵌套未知字段被忽略，客户端仍能解析', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({
        ...queuedTask,
        future: 'added',
        progress: { ...queuedTask.progress, next: 42 },
      }),
    );
    try {
      expect(await apiRequest('/tasks/' + queuedTask.taskId, zTaskResponse)).toEqual(queuedTask);
    } finally {
      fetcher.mockRestore();
    }
  });
  it('损坏夹具经客户端得到contract错误', async () => {
    const fetcher = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json({ ...queuedTask, attempt: -1 }));
    try {
      await expect(apiRequest('/tasks/' + queuedTask.taskId, zTaskResponse)).rejects.toMatchObject({
        kind: 'contract',
      });
    } finally {
      fetcher.mockRestore();
    }
  });
});
