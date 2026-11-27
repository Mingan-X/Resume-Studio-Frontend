import type { Dimension } from './contracts';

export const dimensionLabels: Record<Dimension, string> = {
  technical_depth: '技术深度',
  engineering: '工程能力',
  business_understanding: '业务理解',
  project_impact: '项目影响力',
  collaboration: '协作沟通',
  growth: '成长性',
};
export function publicationLabel(status: string) {
  return status === 'DRAFT' ? '草稿' : status === 'PUBLISHED' ? '已发布' : '状态待确认';
}
const indexLabels: Record<string, string> = {
  NOT_REQUESTED: '未请求索引',
  PENDING: '待索引',
  INDEXING: '索引中',
  READY: '可用',
  FAILED: '索引失败',
};
export function indexLabel(status: string) {
  return indexLabels[status] ?? '索引状态待确认';
}
