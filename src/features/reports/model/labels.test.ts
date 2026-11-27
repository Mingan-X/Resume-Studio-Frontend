import { expect, it } from 'vitest';

import { reportErrorLabel } from './labels';
it('板块错误安全映射且保留未知边界', () => {
  expect(reportErrorLabel(null)).toBe('');
  expect(reportErrorLabel('BUDGET_EXHAUSTED')).toBe('处理预算已耗尽');
  expect(reportErrorLabel('future')).toBe('该部分处理未完成');
});
