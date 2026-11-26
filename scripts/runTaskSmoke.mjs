import { fork, spawn } from 'node:child_process';
import console from 'node:console';
import { once } from 'node:events';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = fork(path.join(root, 'scripts/backendTaskFixture.mjs'), {
  stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
});
const readySchema = z.object({
  type: z.literal('ready'),
  succeededId: z.uuid(),
  queuedId: z.uuid(),
});
let ready = false;
try {
  const message = await Promise.race([
    once(fixture, 'message').then(([value]) => readySchema.parse(value)),
    once(fixture, 'exit').then(() => {
      throw new Error('fixture exited before ready');
    }),
    new Promise((_resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('fixture start deadline')), 60000);
      timer.unref();
    }),
  ]);
  ready = true;
  const env = {
    ...process.env,
    SMOKE_SUCCEEDED_TASK_ID: message.succeededId,
    SMOKE_QUEUED_TASK_ID: message.queuedId,
  };
  const child = spawn(
    process.execPath,
    [path.join(root, 'node_modules/@playwright/test/cli.js'), 'test', '--project=real'],
    { cwd: root, env, stdio: 'inherit' },
  );
  const [code] = await once(child, 'exit');
  process.exitCode = code ?? 1;
} catch {
  console.error('真实任务冒烟未完成：请检查后端编译产物、项目数据库归属、迁移及3000端口。');
  process.exitCode = 1;
} finally {
  if (ready && fixture.connected) {
    const exited = once(fixture, 'exit');
    fixture.send({ type: 'stop' });
    const [code] = await exited;
    if (code !== 0) {
      process.exitCode = 1;
      console.error('合成任务清理失败，需要核查本轮隔离数据。');
    } else console.log('本轮合成任务隔离数据清理通过。');
  } else if (fixture.exitCode === null) fixture.kill();
}
