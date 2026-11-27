import { expect, it } from 'vitest';

import { localTime } from './localTime';

it('本地日期保持约定格式', () =>
  expect(localTime('2026-11-28T00:00:00.000Z')).toMatch(/^2026-11-\d{2} \d{2}:\d{2}$/));
