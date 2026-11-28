import assert from 'node:assert/strict';
import console from 'node:console';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await files(target)));
    else result.push(target);
  }
  return result;
}
const all = await files('dist');
for (const file of all) {
  assert.ok(
    !/\.map$|\.env|mockServiceWorker|\.pem$/i.test(file),
    `Unexpected production file: ${file}`,
  );
  if (!/\.(js|html|css)$/.test(file)) continue;
  const body = await readFile(file, 'utf8');
  for (const forbidden of [
    'synthetic-password-long-123',
    'frontend-smoke-only',
    'CSP_TEST:',
    'localhost:4443',
    '__transport-probe',
    '__sse-probe',
    'sentry.io',
    'ingest.sentry',
    'oaiusercontent.com',
  ])
    assert.ok(!body.includes(forbidden), `Test or telemetry content in ${file}: ${forbidden}`);
}
const errors = await readFile('src/app/errors.ts', 'utf8');
assert.ok(
  errors.includes(
    'if (import.meta.env.DEV) console.error({ kind: error.kind, requestId: error.requestId })',
  ),
  'Development-only minimal error logging required',
);
console.log(
  `Production artifact audit PASS: ${all.length} files; no public sourcemaps, test credentials, mock worker or telemetry endpoints.`,
);
