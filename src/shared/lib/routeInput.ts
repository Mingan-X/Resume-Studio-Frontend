import { z } from 'zod';

export const routeIdSchema = z.uuid();
export const internalRedirectSchema = z
  .string()
  .max(2048)
  .refine((value) => {
    if (!value.startsWith('/') || value.startsWith('//')) return false;
    if (/[\\\s]/u.test(value)) return false;
    if (
      [...value].some(
        (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
      )
    )
      return false;
    // Reject encoded delimiters/control characters, including nested encoding.
    if (/%(?:2f|5c|0[0-9a-f]|1[0-9a-f]|7f|25)/i.test(value)) return false;
    try {
      return new URL(value, 'https://internal.invalid').origin === 'https://internal.invalid';
    } catch {
      return false;
    }
  });

export function safeRedirect(value: unknown): string {
  const parsed = internalRedirectSchema.safeParse(value);
  return parsed.success ? parsed.data : '/resumes';
}
