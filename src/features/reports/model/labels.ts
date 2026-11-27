import type { Dimension, ReportContent } from './contracts';

export const dimensionLabels: Record<Dimension, string> = {
  technical_depth: '技术深度',
  engineering: '工程能力',
  business_understanding: '业务理解',
  project_impact: '项目影响力',
  collaboration: '协作沟通',
  growth: '成长性',
};
export const reportWarningLabels: Record<ReportContent['warnings'][number], string> = {
  PROFILE_UNAVAILABLE: '六维画像暂不可用',
  MATCHING_UNAVAILABLE: '岗位匹配暂不可用',
  DEGRADED_RECALL: '召回范围发生降级',
  INCOMPLETE_REQUIREMENTS: '部分要求未完成判断',
  EMPTY_CANDIDATES: '没有可评估候选岗位',
};
const errorLabels: Record<string, string> = {
  BUDGET_EXHAUSTED: '处理预算已耗尽',
  DEADLINE_EXCEEDED: '处理期限已到',
  UPSTREAM_TIMEOUT: '上游处理超时',
  RATE_LIMITED: '上游请求受限',
  DEPENDENCY_UNAVAILABLE: '依赖服务不可用',
  UPSTREAM_5XX: '上游服务失败',
  INPUT_INVALID: '输入校验失败',
  UNSUPPORTED_INPUT: '输入暂不支持',
  OUTPUT_INVALID: '结果校验失败',
  EXECUTION_FAILED: '处理失败',
};
export function reportErrorLabel(code: string | null) {
  return code ? (errorLabels[code] ?? '该部分处理未完成') : '';
}
