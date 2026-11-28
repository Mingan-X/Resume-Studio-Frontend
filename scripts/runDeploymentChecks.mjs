import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import console from 'node:console';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  backend = path.resolve(root, '../Resume-Studio-Backend');
const nginx = path.resolve(
  process.env.NGINX_EXE ?? path.join(root, '.smoke-runs/nginx-official/nginx-1.30.8/nginx.exe'),
);
const nginxRoot = path.dirname(nginx);
await mkdir(path.join(root, '.smoke-runs'), { recursive: true });
const runRoot = await mkdtemp(path.join(root, '.smoke-runs/nginx-'));
await mkdir(path.join(runRoot, 'logs'));
await mkdir(path.join(runRoot, 'temp'));
const forward = (value) => value.replaceAll('\\', '/');
const headers = await readFile(path.join(root, 'deploy/security-headers.conf'), 'utf8'),
  locations = await readFile(path.join(root, 'deploy/locations.conf'), 'utf8');
await writeFile(path.join(runRoot, 'headers.conf'), headers);
await writeFile(
  path.join(runRoot, 'strict.conf'),
  headers.replace("style-src-attr 'unsafe-inline'", "style-src-attr 'none'"),
);
await writeFile(path.join(runRoot, 'locations.conf'), locations);
await writeFile(
  path.join(runRoot, 'nginx.conf'),
  `daemon off; master_process off; pid "${forward(runRoot)}/nginx.pid"; error_log "${forward(runRoot)}/logs/error.log" warn; events { worker_connections 128; } http { include "${forward(nginxRoot)}/conf/mime.types"; default_type application/octet-stream; access_log off; map $uri $frontend_cache { default "no-cache"; ~^/assets/ "public, max-age=31536000, immutable"; ~^/api/ "no-store"; } ${[8088, 8089].map((port) => `server { listen 127.0.0.1:${port}; server_name localhost; root "${forward(root)}/dist"; include "${forward(runRoot)}/${port === 8088 ? 'headers' : 'strict'}.conf"; include "${forward(runRoot)}/locations.conf"; }`).join('\n')} }`,
);
const syntax = spawnSync(nginx, ['-t', '-p', forward(runRoot) + '/', '-c', 'nginx.conf'], {
  cwd: runRoot,
  windowsHide: true,
  encoding: 'utf8',
});
assert.equal(syntax.status, 0, syntax.stderr);
console.log('nginx configuration syntax PASS');
const api = spawn(process.execPath, [path.join(backend, 'dist/src/main-api.js')], {
  cwd: backend,
  env: {
    ...process.env,
    APP_ENV: 'development',
    HTTP_HOST: '127.0.0.1',
    HTTP_PORT: '3000',
    TASK_API_ENABLED: 'false',
    RESUME_API_ENABLED: 'false',
    JOB_API_ENABLED: 'false',
    AUTH_ENABLED: 'false',
    READINESS_ENABLED: 'false',
  },
  stdio: 'ignore',
  windowsHide: true,
});
const server = spawn(nginx, ['-p', forward(runRoot) + '/', '-c', 'nginx.conf'], {
  cwd: runRoot,
  stdio: 'ignore',
  windowsHide: true,
});
async function waitReady() {
  for (let i = 0; i < 40; i++) {
    if (api.exitCode !== null || server.exitCode !== null) throw new Error('test service exited');
    try {
      if ((await fetch('http://127.0.0.1:8088/health', { signal: AbortSignal.timeout(1000) })).ok)
        return;
    } catch {
      /* bounded startup */
    }
    await delay(250);
  }
  throw new Error('test service deadline');
}
try {
  await waitReady();
  const test = spawn(
    process.execPath,
    [
      path.join(root, 'node_modules/@playwright/test/cli.js'),
      'test',
      '--project=deployment',
      '--workers=1',
    ],
    { cwd: root, stdio: 'inherit' },
  );
  const [code] = await once(test, 'exit');
  process.exitCode = code ?? 1;
} finally {
  server.kill();
  api.kill();
  await Promise.allSettled([
    server.exitCode === null ? once(server, 'exit') : Promise.resolve(),
    api.exitCode === null ? once(api, 'exit') : Promise.resolve(),
  ]);
  console.log(
    'Only this run nginx/API processes stopped; logs retained:',
    path.relative(root, runRoot),
  );
}
