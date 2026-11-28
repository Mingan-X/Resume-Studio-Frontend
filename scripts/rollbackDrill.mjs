import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import console from 'node:console';
import { once } from 'node:events';
import { cp, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  base = path.join(root, '.smoke-runs');
await mkdir(base, { recursive: true });
const run = await mkdtemp(path.join(base, 'rollback-')),
  nginx = path.resolve(
    process.env.NGINX_EXE ?? path.join(base, 'nginx-official/nginx-1.30.8/nginx.exe'),
  );
const f = (value) => value.replaceAll('\\', '/');
await mkdir(path.join(run, 'logs'));
await mkdir(path.join(run, 'temp'));
for (const version of ['a', 'b']) {
  await cp(path.join(root, 'dist'), path.join(run, version), { recursive: true });
  const index = path.join(run, version, 'index.html');
  await writeFile(
    index,
    (await readFile(index, 'utf8')).replace(
      '</head>',
      `<meta name="release-drill" content="${version}" /></head>`,
    ),
  );
}
function config(version) {
  return `daemon off; pid "${f(run)}/nginx.pid"; error_log "${f(run)}/logs/error.log" warn; events { worker_connections 64; } http { access_log off; include "${f(path.dirname(nginx))}/conf/mime.types"; server { listen 127.0.0.1:8090; root "${f(run)}/${version}"; location / { try_files $uri /index.html; add_header Cache-Control no-cache; } } }`;
}
await writeFile(path.join(run, 'nginx.conf'), config('a'));
const args = ['-p', f(run) + '/', '-c', 'nginx.conf'];
assert.equal(
  spawnSync(nginx, ['-t', ...args], { cwd: run, windowsHide: true, stdio: 'ignore' }).status,
  0,
);
const server = spawn(nginx, args, { cwd: run, windowsHide: true, stdio: 'ignore' });
async function check(version) {
  for (let count = 0; count < 40; count++) {
    try {
      const response = await fetch('http://127.0.0.1:8090/reports/synthetic', {
        signal: AbortSignal.timeout(1000),
      });
      const html = await response.text();
      if (html.includes(`content="${version}"`)) {
        assert.equal(response.headers.get('cache-control'), 'no-cache');
        return;
      }
    } catch {
      /* bounded startup/reload */
    }
    await delay(100);
  }
  throw new Error(`release ${version} unavailable`);
}
try {
  await check('a');
  await writeFile(path.join(run, 'nginx.conf'), config('b'));
  assert.equal(
    spawnSync(nginx, ['-s', 'reload', ...args], { cwd: run, windowsHide: true, stdio: 'ignore' })
      .status,
    0,
  );
  await check('b');
  await writeFile(path.join(run, 'nginx.conf'), config('a'));
  assert.equal(
    spawnSync(nginx, ['-s', 'reload', ...args], { cwd: run, windowsHide: true, stdio: 'ignore' })
      .status,
    0,
  );
  await check('a');
  console.log(
    'Local nginx release A -> B -> A verified with production artifacts; original dist unchanged.',
  );
} finally {
  const exited = server.exitCode === null ? once(server, 'exit') : Promise.resolve();
  spawnSync(nginx, ['-s', 'quit', ...args], { cwd: run, windowsHide: true, stdio: 'ignore' });
  await exited;
  console.log('Only drill nginx stopped; evidence retained:', path.relative(root, run));
}
