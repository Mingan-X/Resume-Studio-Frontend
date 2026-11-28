import assert from 'node:assert/strict';
import console from 'node:console';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { z } from 'zod';

const manifest = z
  .record(
    z.string(),
    z.object({
      file: z.string(),
      imports: z.array(z.string()).optional(),
      dynamicImports: z.array(z.string()).optional(),
    }),
  )
  .parse(JSON.parse(await readFile('dist/.vite/manifest.json', 'utf8')));
const visited = new Set();
function collect(key) {
  if (visited.has(key)) return;
  const item = manifest[key];
  assert.ok(item, `Missing manifest entry ${key}`);
  visited.add(key);
  for (const dependency of item.imports ?? []) collect(dependency);
}
// 初始重定向/resumes的入口与懒加载页；其他业务页的动态块不计首屏。
collect('index.html');
collect('src/pages/ResumesPage.vue');
const chunks = [];
for (const key of visited) {
  const item = manifest[key];
  if (item.file.endsWith('.js')) {
    const bytes = await readFile(path.join('dist', item.file));
    chunks.push({ file: item.file, bytes: bytes.length, gzip: gzipSync(bytes).length });
  }
}
const gzipBytes = chunks.reduce((sum, item) => sum + item.gzip, 0),
  budgetBytes = 300 * 1024;
const report = {
  entry: '/resumes',
  gzipBytes,
  budgetBytes,
  passed: gzipBytes <= budgetBytes,
  chunks,
};
await writeFile('dist/build-analysis.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
assert.ok(report.passed, 'Initial JS gzip exceeds 300 KiB');
