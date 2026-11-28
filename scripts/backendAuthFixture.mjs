import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  backend = path.resolve(root, '../Resume-Studio-Backend'),
  runRoot = path.resolve(process.argv[2] ?? '');
const relative = path.relative(path.join(root, '.smoke-runs'), runRoot);
assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
process.chdir(backend);
process.loadEnvFile('infra/.env');
const requireBackend = createRequire(path.join(backend, 'package.json'));
requireBackend('reflect-metadata');
const { Test } = requireBackend('@nestjs/testing');
const load = (relative) => import(pathToFileURL(path.join(backend, 'dist', relative)).href);
const { ownedPostgres } = await load('src/infrastructure/checkpoint/ownership.js'),
  { loadInfrastructureConfig } = await load('src/infrastructure/config.js'),
  { DatabaseService } = await load('src/infrastructure/database/database.service.js');
const { ApiModule } = await load('src/app-api.module.js'),
  { AuthModule } = await load('src/modules/auth/auth.module.js'),
  { ResumeApiModule } = await load('src/modules/resumes/resume-api.module.js'),
  { JobApiModule } = await load('src/modules/jobs/job-api.module.js'),
  { TaskApiModule } = await load('src/modules/tasks/task-api.module.js');
const { configureHttp } = await load('src/bootstrap-api.js'),
  { loadConfig } = await load('src/modules/config/app-config.js'),
  { AuthRepository } = await load('src/infrastructure/tasks/auth.repository.js');
const { readSessionCookie, tokenHash } = await load('src/modules/auth/session-token.js'),
  { JOB_INDEX_TARGET } = await load('src/modules/jobs/job-publication.service.js'),
  { jobIndexTargetSchema } = await load('src/contracts/job-publication.js');
const { syntheticPdf } = await load('test/support/document-fixtures.js');
await ownedPostgres();
const config = loadInfrastructureConfig(process.env),
  database = new DatabaseService(config),
  db = database.client,
  origin = 'https://localhost:4443';
const tokens = new Set();
let account,
  app,
  proxy,
  finished = false;
async function finish() {
  if (finished) return;
  finished = true;
  try {
    if (proxy) {
      proxy.closeAllConnections();
      await new Promise((resolve) => proxy.close(resolve));
    }
    if (app) await app.close();
    await ownedPostgres();
    if (account) {
      assert.equal(
        await db.resourceOperation.count({ where: { ownerId: account.ownerId, stoppedAt: null } }),
        0,
      );
      assert.equal(await db.taskAttempt.count({ where: { ownerId: account.ownerId } }), 0);
      await db.$transaction(async (tx) => {
        const where = { ownerId: account.ownerId };
        await tx.authSession.deleteMany({
          where: { OR: [{ accountId: account.id }, { tokenHash: { in: [...tokens] } }] },
        });
        await tx.outboxEvent.deleteMany({ where });
        await tx.jobIndexTarget.deleteMany({ where });
        await tx.jobIndexTask.deleteMany({ where });
        await tx.jobVersion.deleteMany({ where });
        await tx.job.deleteMany({ where });
        await tx.resumeUpload.deleteMany({ where });
        await tx.extractedDocument.deleteMany({ where });
        await tx.evidenceBlock.deleteMany({ where });
        await tx.resumeVersion.deleteMany({ where });
        await tx.resume.deleteMany({ where });
        await tx.fileAsset.deleteMany({ where });
        await tx.account.delete({ where: { id: account.id } });
        await tx.owner.delete({ where: { id: account.ownerId } });
      });
      assert.equal(await db.owner.count({ where: { id: account.ownerId } }), 0);
    }
    await writeFile(path.join(runRoot, 'manifest.json'), JSON.stringify({ state: 'cleaned' }));
  } finally {
    await database.onModuleDestroy();
  }
}
try {
  const username = `frontend-${randomUUID()}`;
  account = await new AuthRepository(database).createAccount(
    username,
    'synthetic-password-long-123',
  );
  await writeFile(
    path.join(runRoot, 'manifest.json'),
    JSON.stringify({ state: 'active', ownerId: account.ownerId, accountId: account.id }),
  );
  const storageRoot = path.join(runRoot, 'storage');
  await mkdir(storageRoot);
  await writeFile(
    path.join(runRoot, 'synthetic.pdf'),
    syntheticPdf([{ text: '合成认证简历：工程测试' }]),
  );
  const auth = { databaseUrl: config.databaseUrl, origin };
  const appConfig = loadConfig('api', {
    APP_ENV: 'development',
    HTTP_PORT: '3000',
    AUTH_ENABLED: 'true',
    AUTH_ORIGIN: origin,
    DATABASE_URL: config.databaseUrl,
  });
  const target = jobIndexTargetSchema.parse({
    embeddingVersion: 'auth-smoke-only',
    indexVersion: 'auth-smoke-only',
    chunkerVersion: 'jd-text-v1',
    componentVersion: 'auth-smoke-only',
    budget: {
      maxAttempts: 1,
      maxModelCalls: 0,
      maxTokens: 0,
      maxCostMicros: 0,
      currency: 'CNY',
      maxDurationMs: 30000,
    },
  });
  const module = await Test.createTestingModule({
    imports: [
      ApiModule.register(appConfig, [
        AuthModule.register(auth, true),
        ResumeApiModule.register({ databaseUrl: config.databaseUrl, storageRoot }, true),
        await JobApiModule.register({ databaseUrl: config.databaseUrl }, true),
        TaskApiModule.register({ databaseUrl: config.databaseUrl }, null, true),
      ]),
    ],
  })
    .overrideProvider(JOB_INDEX_TARGET)
    .useValue(target)
    .compile();
  app = module.createNestApplication({ logger: false });
  app.use((_req, res, next) => {
    res.on('finish', () => {
      const headers = res.getHeader('set-cookie');
      for (const value of Array.isArray(headers) ? headers : headers ? [headers] : []) {
        const token = readSessionCookie(String(value));
        if (token) tokens.add(tokenHash(token));
      }
    });
    next();
  });
  configureHttp(app);
  await app.listen(3000, '127.0.0.1');
  proxy = https.createServer(
    {
      key: await readFile(path.join(runRoot, 'key.pem')),
      cert: await readFile(path.join(runRoot, 'cert.pem')),
    },
    (req, res) => {
      const upstream = http.request(
        {
          hostname: '127.0.0.1',
          port: 4173,
          path: req.url,
          method: req.method,
          headers: req.headers,
        },
        (response) => {
          response.on('error', () => res.destroy());
          res.on('close', () => {
            response.destroy();
            upstream.destroy();
          });
          res.writeHead(response.statusCode ?? 502, response.headers);
          response.pipe(res);
        },
      );
      upstream.on('error', () => {
        if (res.destroyed) return;
        if (!res.headersSent) res.writeHead(502);
        res.end();
      });
      req.pipe(upstream);
      req.on('aborted', () => upstream.destroy());
    },
  );
  await new Promise((resolve) => proxy.listen(4443, '127.0.0.1', resolve));
  const keepalive = setInterval(() => {}, 1000);
  process.send?.({ type: 'ready', username, runRoot });
  process.on('message', async (message) => {
    if (message?.type !== 'stop') return;
    try {
      await finish();
      clearInterval(keepalive);
      process.send?.({ type: 'cleaned' });
      process.disconnect();
    } catch {
      clearInterval(keepalive);
      process.exitCode = 1;
      process.send?.({ type: 'failed', code: 'CLEANUP_UNCONFIRMED' });
      process.disconnect();
    }
  });
} catch {
  try {
    await finish();
  } catch {
    process.exitCode = 1;
  }
  process.exitCode = 1;
  process.send?.({ type: 'failed', code: 'START_FAILED' });
  process.disconnect?.();
}
