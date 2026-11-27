import { fork, spawn } from 'node:child_process';
import console from 'node:console';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  parent = path.join(root, '.smoke-runs');
await mkdir(parent, { recursive: true });
const runRoot = await mkdtemp(path.join(parent, 'resumes-'));
const fixture = fork(path.join(root, 'scripts/backendResumeFixture.mjs'), [runRoot], {
  stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
});
let ready = false,
  cleaned = false;
try {
  await Promise.race([
    once(fixture, 'message').then(([message]) =>
      z.object({ type: z.literal('ready'), runRoot: z.literal(runRoot) }).parse(message),
    ),
    once(fixture, 'exit').then(() => {
      throw new Error('fixture exited');
    }),
    new Promise((_resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('start deadline')), 60000);
      timer.unref();
    }),
  ]);
  ready = true;
  const child = spawn(
    process.execPath,
    [
      path.join(root, 'node_modules/@playwright/test/cli.js'),
      'test',
      '--project=real',
      '--workers=1',
      'resumes.smoke.spec.ts',
    ],
    { cwd: root, env: { ...process.env, RESUME_SMOKE_ROOT: runRoot }, stdio: 'inherit' },
  );
  const [code] = await once(child, 'exit');
  process.exitCode = code ?? 1;
} catch {
  console.error('真实简历冒烟启动或运行失败，保留本轮manifest供核查。');
  process.exitCode = 1;
} finally {
  if (ready && fixture.connected) {
    const exited = once(fixture, 'exit');
    fixture.send({ type: 'stop' });
    const [code] = await exited;
    cleaned = code === 0;
    if (!cleaned) process.exitCode = 1;
  } else if (fixture.exitCode === null) fixture.kill();
  if (cleaned) {
    z.object({ state: z.literal('cleaned'), ownerId: z.uuid() }).parse(
      JSON.parse(await readFile(path.join(runRoot, 'manifest.json'), 'utf8')),
    );
    const relative = path.relative(parent, path.resolve(runRoot));
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      process.exitCode = 1;
      console.error('拒绝清理越界目录。');
    } else {
      await rm(runRoot, { recursive: true });
      console.log('本轮owner与专用文件目录已清理。');
    }
  }
}
