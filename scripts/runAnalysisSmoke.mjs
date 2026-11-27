import { fork, spawn } from 'node:child_process';
import console from 'node:console';
import { once } from 'node:events';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = fork(path.join(root, 'scripts/backendAnalysisFixture.mjs'), {
  stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
});
let ready = false;
try {
  await Promise.race([
    once(fixture, 'message').then(([message]) =>
      z.object({ type: z.literal('ready') }).parse(message),
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
      'analyses.smoke.spec.ts',
      'reports.smoke.spec.ts',
    ],
    { cwd: root, stdio: 'inherit' },
  );
  const [code] = await once(child, 'exit');
  process.exitCode = code ?? 1;
} catch {
  process.exitCode = 1;
  console.error('真实分析创建冒烟未完成，请核对项目服务与已编译后端。');
} finally {
  if (ready && fixture.connected) {
    const exited = once(fixture, 'exit');
    fixture.send({ type: 'stop' });
    const [code] = await exited;
    if (code !== 0) {
      process.exitCode = 1;
      console.error('分析冒烟清理未确认。');
    } else console.log('本轮合成输入、未执行任务与owner已精确清理。');
  } else if (fixture.exitCode === null) fixture.kill();
}
