import { expect, it } from 'vitest';

import { evidenceLocation, sourceKey } from './evidence';
it('来源位置使用返回值且引用键包含版本和区间', () => {
  const block = { id: 'id', ordinal: 0, text: 'text', textHash: 'hash' };
  expect(evidenceLocation({ ...block, location: { kind: 'PDF', page: 2, bounds: null } })).toBe(
    'PDF 第 2 页',
  );
  expect(evidenceLocation({ ...block, location: { kind: 'TEXT', paragraph: 0 } })).toContain(
    '文本段落 0',
  );
  expect(
    evidenceLocation({ ...block, location: { kind: 'DOCX', paragraph: 3, table: null } }),
  ).toContain('DOCX 段落 3');
  expect(
    evidenceLocation({
      ...block,
      location: { kind: 'DOCX', paragraph: 3, table: { index: 0, row: 1, cell: 2 } },
    }),
  ).toContain('表格 0 行 1 单元格 2');
  expect(
    sourceKey({
      sourceType: 'RESUME',
      sourceVersionId: 'v',
      blockId: 'b',
      start: 1,
      end: 2,
      quote: 'x',
    }),
  ).toBe('v:b:1:2');
});
