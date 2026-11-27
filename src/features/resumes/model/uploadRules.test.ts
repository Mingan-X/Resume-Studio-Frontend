import { expect, it } from 'vitest';

import { MAX_RESUME_BYTES, resumeFileSchema } from './uploadRules';

it('只接受非空PDF/DOCX，大小边界包含上限', () => {
  expect(
    resumeFileSchema.safeParse(new File([new Uint8Array(MAX_RESUME_BYTES)], 'A.PDF')).success,
  ).toBe(true);
  expect(resumeFileSchema.safeParse(new File(['x'], 'A.docx')).success).toBe(true);
  expect(resumeFileSchema.safeParse('file.pdf').success).toBe(false);
});
