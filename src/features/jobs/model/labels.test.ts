import { expect, it } from 'vitest';

import { indexLabel, publicationLabel } from './labels';

it('状态用中文区分并容忍未来枚举', () => {
  expect(publicationLabel('DRAFT')).toBe('草稿');
  expect(publicationLabel('PUBLISHED')).toBe('已发布');
  expect(publicationLabel('FUTURE')).toBe('状态待确认');
  for (const [status, label] of [
    ['PENDING', '待索引'],
    ['INDEXING', '索引中'],
    ['READY', '可用'],
    ['FAILED', '索引失败'],
    ['NOT_REQUESTED', '未请求索引'],
    ['FUTURE', '索引状态待确认'],
  ])
    expect(indexLabel(status ?? '')).toBe(label);
});
