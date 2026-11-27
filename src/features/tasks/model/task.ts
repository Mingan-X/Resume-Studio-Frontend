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
  LOAD: '加载冻结输入',
  PARSE: '读取解析文本',
  EXTRACT: '提取简历信息',
  VALIDATE: '校验结构化信息',
  PROFILE: '生成六维画像',
  RECALL: '检索候选岗位',
  SNAP: '保存候选范围',
  MATCH: '逐项匹配',
  SCORE: '计算匹配结果',
  RANK: '整理推荐顺序',
  JOIN: '汇总结果',
  SAVE: '保存报告',
  FINALIZE: '提交任务结果',
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
  const date = new Date(time);
  const twoDigits = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())} ${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`;
}
