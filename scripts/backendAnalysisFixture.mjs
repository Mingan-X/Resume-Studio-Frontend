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
  { loadInfrastructureConfig } = await load('src/infrastructure/config.js'),
  { DatabaseService } = await load('src/infrastructure/database/database.service.js');
const { seedRealAnalysis, cleanRealAnalysis } = await load('test/support/real-analysis.js');
const { ApiModule } = await load('src/app-api.module.js'),
  { TaskApiModule } = await load('src/modules/tasks/task-api.module.js'),
  { configureHttp } = await load('src/bootstrap-api.js'),
  { loadConfig } = await load('src/modules/config/app-config.js'),
  { IDENTITY } = await load('src/modules/identity/identity.module.js');
await ownedPostgres();
const config = loadInfrastructureConfig(process.env),
  database = new DatabaseService(config),
  ownerId = randomUUID();
let app,
  finished = false,
  created = false;
async function finish() {
  if (finished) return;
  finished = true;
  try {
    if (app) await app.close();
    if (created) {
      await ownedPostgres();
      assert.equal(await database.client.taskAttempt.count({ where: { ownerId } }), 0);
      await cleanRealAnalysis(database, ownerId);
      assert.equal(await database.client.owner.count({ where: { id: ownerId } }), 0);
    }
  } finally {
    await database.onModuleDestroy();
  }
}
try {
  created = true;
  const seeded = await seedRealAnalysis(database, ownerId);
  // 只准备合成资源和配置并创建QUEUED任务，不执行模型、图、向量或评分。
  const module = await Test.createTestingModule({
    imports: [
      ApiModule.register(loadConfig('api', { APP_ENV: 'development', HTTP_PORT: '3000' }), [
        TaskApiModule.register({ databaseUrl: config.databaseUrl }, seeded.settings),
      ]),
    ],
  })
    .overrideProvider(IDENTITY)
    .useValue({ getOwnerId: async () => ownerId })
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
