import type { TaskResponse } from '@/generated/types.gen';
import { zTaskResponse } from '@/generated/zod.gen';

export type Task = TaskResponse;
export const taskSchema = zTaskResponse;
export function isTerminal(status?: Task['status']): boolean {
  return (
    status === 'SUCCEEDED' || status === 'PARTIAL' || status === 'FAILED' || status === 'CANCELLED'
  );
}
export const statusLabels: Record<Task['status'], string> = {
  QUEUED: '等待处理',
  RUNNING: '处理中',
  RETRY_WAIT: '等待重试',
  SUCCEEDED: '已完成',
  PARTIAL: '部分完成',
  FAILED: '处理失败',
  CANCELLED: '已取消',
};
const stageLabels: Record<string, string> = {
  QUEUED: '等待处理',
  SYNTHETIC_RUNNING: '合成任务处理中',
  SYNTHETIC_COMPLETED: '合成任务完成',
  RECOVERY_QUEUED: '等待恢复',
  CANCELLED: '已取消',
};
export function stageLabel(stage: string): string {
  return stageLabels[stage] ?? stage;
}
export function retryTime(time: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(time));
}
