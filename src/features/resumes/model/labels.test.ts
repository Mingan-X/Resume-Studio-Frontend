import { expect, it } from 'vitest';

import { locationLabel } from './labels';

it('使用后端原始位置，不虚构DOCX页码或修改段落编号', () => {
  expect(locationLabel({ kind: 'PDF', page: 2, bounds: null })).toBe('PDF 第 2 页');
  expect(locationLabel({ kind: 'DOCX', paragraph: 0, table: null })).toBe('DOCX 段落 0（从0开始）');
  expect(
    locationLabel({ kind: 'DOCX', paragraph: 4, table: { index: 0, row: 2, cell: 1 } }),
  ).toContain('表格 0 / 行 2 / 单元格 1');
  expect(locationLabel({ kind: 'TEXT', paragraph: 3 })).toContain('文本段落 3');
});
