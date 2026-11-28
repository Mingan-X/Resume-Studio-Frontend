import { execFileSync, fork, spawn } from 'node:child_process';
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
const runRoot = await mkdtemp(path.join(parent, 'auth-'));
const openssl =
  process.platform === 'win32' ? 'D:/programefiles/Git/usr/bin/openssl.exe' : 'openssl';
execFileSync(
  openssl,
  [
    'req',
    '-x509',
    '-newkey',
    'rsa:2048',
    '-sha256',
    '-nodes',
    '-days',
    '1',
    '-keyout',
    path.join(runRoot, 'key.pem'),
    '-out',
    path.join(runRoot, 'cert.pem'),
    '-subj',
    '/CN=localhost',
    '-addext',
    'subjectAltName=DNS:localhost,IP:127.0.0.1',
  ],
  { stdio: 'ignore' },
);
const fixture = fork(path.join(root, 'scripts/backendAuthFixture.mjs'), [runRoot], {
  stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
});
let ready = false;
try {
  const message = await Promise.race([
    once(fixture, 'message').then(([value]) =>
      z
        .object({ type: z.literal('ready'), username: z.string(), runRoot: z.literal(runRoot) })
        .parse(value),
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
      '--project=auth-real',
      '--workers=1',
      'auth.smoke.spec.ts',
    ],
    {
      cwd: root,
      env: { ...process.env, AUTH_SMOKE_USER: message.username, AUTH_SMOKE_ROOT: runRoot },
      stdio: 'inherit',
    },
  );
  const [code] = await once(child, 'exit');
  process.exitCode = code ?? 1;
} catch {
  process.exitCode = 1;
  console.error('HTTPS会话冒烟未完成，保留隔离目录供核查。');
} finally {
  if (ready && fixture.connected) {
    const exited = once(fixture, 'exit');
    fixture.send({ type: 'stop' });
    const [code] = await exited;
    if (code !== 0) {
      process.exitCode = 1;
      console.error('会话清理未确认。');
    } else {
      z.object({ state: z.literal('cleaned') }).parse(
        JSON.parse(await readFile(path.join(runRoot, 'manifest.json'), 'utf8')),
      );
      const rel = path.relative(parent, runRoot);
      if (rel && !rel.startsWith('..') && !path.isAbsolute(rel)) {
        await rm(runRoot, { recursive: true });
        console.log('合成账号、会话、业务数据及临时TLS文件已清理。');
      }
    }
  } else if (fixture.exitCode === null) fixture.kill();
}
