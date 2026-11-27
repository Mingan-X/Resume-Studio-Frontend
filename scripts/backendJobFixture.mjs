import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  backend = path.resolve(root, '../Resume-Studio-Backend');
process.chdir(backend);
process.loadEnvFile('infra/.env');
const requireBackend = createRequire(path.join(backend, 'package.json'));
requireBackend('reflect-metadata');
const { Test } = requireBackend('@nestjs/testing');
const load = (relative) => import(pathToFileURL(path.join(backend, 'dist', relative)).href);
const { ownedPostgres } = await load('src/infrastructure/checkpoint/ownership.js'),
  { loadInfrastructureConfig } = await load('src/infrastructure/config.js');
const { DatabaseService } = await load('src/infrastructure/database/database.service.js'),
  { ApiModule } = await load('src/app-api.module.js');
const { JobApiModule } = await load('src/modules/jobs/job-api.module.js'),
  { TaskApiModule } = await load('src/modules/tasks/task-api.module.js');
const { configureHttp } = await load('src/bootstrap-api.js'),
  { loadConfig } = await load('src/modules/config/app-config.js');
const { IDENTITY } = await load('src/modules/identity/identity.module.js'),
  { JOB_INDEX_TARGET } = await load('src/modules/jobs/job-publication.service.js');
const { jobIndexTargetSchema } = await load('src/contracts/job-publication.js');
await ownedPostgres();
const config = loadInfrastructureConfig(process.env),
  database = new DatabaseService(config),
  db = database.client,
  ownerId = randomUUID();
let app,
  created = false,
  finished = false;
async function finish() {
  if (finished) return;
  finished = true;
  try {
    if (app) await app.close();
    if (created) {
      await ownedPostgres();
      assert.equal(await db.resourceOperation.count({ where: { ownerId, stoppedAt: null } }), 0);
      assert.equal(
        await db.taskAttempt.count({ where: { ownerId } }),
        0,
        'index execution unexpected',
      );
      await db.$transaction(async (tx) => {
        const where = { ownerId };
        await tx.outboxEvent.deleteMany({ where });
        await tx.jobIndexRequest.deleteMany({ where });
        await tx.jobIndexTarget.deleteMany({ where });
        await tx.jobIndexTask.deleteMany({ where });
        await tx.jobVersion.deleteMany({ where });
        await tx.job.deleteMany({ where });
        await tx.owner.delete({ where: { id: ownerId } });
      });
      assert.equal(await db.owner.count({ where: { id: ownerId } }), 0);
    }
  } finally {
    await database.onModuleDestroy();
  }
}
try {
  await db.owner.create({ data: { id: ownerId } });
  created = true;
  // 仅本轮未消费索引任务的标识，不配置真实向量服务，也不标READY。
  const target = jobIndexTargetSchema.parse({
    embeddingVersion: 'frontend-smoke-only',
    indexVersion: 'frontend-smoke-only',
    chunkerVersion: 'jd-text-v1',
    componentVersion: 'frontend-smoke-only',
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
      ApiModule.register(loadConfig('api', { APP_ENV: 'development', HTTP_PORT: '3000' }), [
        await JobApiModule.register({ databaseUrl: config.databaseUrl }),
        TaskApiModule.register({ databaseUrl: config.databaseUrl }),
      ]),
    ],
  })
    .overrideProvider(IDENTITY)
    .useValue({ getOwnerId: async () => ownerId })
    .overrideProvider(JOB_INDEX_TARGET)
    .useValue(target)
    .compile();
  app = module.createNestApplication({ logger: false });
  configureHttp(app);
  await app.listen(3000, '127.0.0.1');
  process.send?.({ type: 'ready' });
  process.on('message', async (message) => {
    if (message?.type !== 'stop') return;
    try {
      await finish();
      process.send?.({ type: 'cleaned' });
      process.disconnect();
    } catch {
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
