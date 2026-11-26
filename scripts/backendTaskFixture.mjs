import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

// 仅真实冒烟：复用后端已有编译产物和真实HTTP/数据库，不写后端文件。
const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backend = path.resolve(frontend, '../Resume-Studio-Backend');
process.chdir(backend);
process.loadEnvFile(path.join(backend, 'infra/.env'));
const requireBackend = createRequire(path.join(backend, 'package.json'));
requireBackend('reflect-metadata');
const { Test } = requireBackend('@nestjs/testing');
const fromBackend = (relative) => import(pathToFileURL(path.join(backend, 'dist', relative)).href);
const { ownedPostgres } = await fromBackend('src/infrastructure/checkpoint/ownership.js');
const { loadInfrastructureConfig } = await fromBackend('src/infrastructure/config.js');
const { DatabaseService } = await fromBackend('src/infrastructure/database/database.service.js');
const { ApiModule } = await fromBackend('src/app-api.module.js');
const { TaskApiModule } = await fromBackend('src/modules/tasks/task-api.module.js');
const { configureHttp } = await fromBackend('src/bootstrap-api.js');
const { loadConfig } = await fromBackend('src/modules/config/app-config.js');
const { IDENTITY } = await fromBackend('src/modules/identity/identity.module.js');
const { TaskCreationService } = await fromBackend('src/modules/tasks/task-creation.service.js');
const { TaskRepository } = await fromBackend('src/infrastructure/tasks/task.repository.js');
const { TaskExecutionStore } = await fromBackend(
  'src/infrastructure/consumer/task-execution.store.js',
);
const { SyntheticCompletionHandler } = await fromBackend(
  'src/infrastructure/consumer/task-delivery.handler.js',
);
const { consumerConfigSchema } = await fromBackend('src/infrastructure/consumer/config.js');
const { reconciliationConfigSchema } = await fromBackend(
  'src/infrastructure/reconciliation/config.js',
);
const { analysisInput } = await fromBackend('test/support/task-inputs.js');
const { taskDispatchSchema } = await fromBackend('src/contracts/tasks.js');

await ownedPostgres();
const config = loadInfrastructureConfig(process.env);
const ownerId = randomUUID();
const database = new DatabaseService(config);
const db = database.client;
let app;
let ownerCreated = false;
let succeededId;
let queuedId;
let finished = false;
async function finish() {
  if (finished) return;
  finished = true;
  try {
    if (app) await app.close();
    if (ownerCreated) {
      await ownedPostgres();
      // 只清理本轮随机owner，不删除既有owner或重置数据库。
      await db.$transaction(async (tx) => {
        const where = { ownerId };
        await tx.nodeArtifact.deleteMany({ where });
        await tx.syntheticIndexTarget.deleteMany({ where });
        await tx.consumerReceipt.deleteMany({ where });
        await tx.taskEvent.deleteMany({ where });
        await tx.taskAttempt.deleteMany({ where });
        await tx.outboxEvent.deleteMany({ where });
        await tx.analysisTask.deleteMany({ where });
        await tx.jobIndexTask.deleteMany({ where });
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
  ownerCreated = true;
  const module = await Test.createTestingModule({
    imports: [
      ApiModule.register(loadConfig('api', { APP_ENV: 'development', HTTP_PORT: '3000' }), [
        TaskApiModule.register(config),
      ]),
    ],
  })
    .overrideProvider(IDENTITY)
    .useValue({ getOwnerId: async () => ownerId })
    .compile();
  app = module.createNestApplication({ logger: false });
  configureHttp(app);
  await app.listen(3000, '127.0.0.1');
  const service = new TaskCreationService(
    { getOwnerId: async () => ownerId },
    new TaskRepository(database),
  );
  const create = async () => {
    const input = analysisInput();
    input.budget.maxDurationMs = 600000;
    return service.createAnalysis(randomUUID(), input);
  };
  succeededId = (await create()).taskId;
  queuedId = (await create()).taskId;
  const outbox = await db.outboxEvent.findFirstOrThrow({
    where: { ownerId, aggregateId: succeededId },
  });
  const execution = new TaskExecutionStore(database, consumerConfigSchema.parse({}));
  const claimed = await execution.claim(ownerId, taskDispatchSchema.parse(outbox.payload));
  assert.equal(claimed.kind, 'acquired');
  await execution.complete(
    claimed.claim,
    await new SyntheticCompletionHandler().execute(claimed.claim, new AbortController().signal),
  );
  process.send?.({ type: 'ready', succeededId, queuedId });
  process.on('message', async (message) => {
    if (message?.type !== 'stop') return;
    try {
      const row = await db.analysisTask.findUniqueOrThrow({
        where: { ownerId_id: { ownerId, id: queuedId } },
      });
      if (row.cancelRequested) {
        assert.equal(
          await execution.reconcile(
            ownerId,
            'analysis',
            queuedId,
            reconciliationConfigSchema.parse({}),
          ),
          'cancelled',
        );
        const response = await fetch(`http://127.0.0.1:3000/api/v1/tasks/${queuedId}`);
        const body = await response.json();
        assert.equal(body.status, 'CANCELLED');
      }
      await finish();
      process.send?.({ type: 'cleaned' });
      process.disconnect();
    } catch {
      await finish();
      process.send?.({ type: 'failed', code: 'CLEANUP_FAILED' });
      process.exitCode = 1;
      process.disconnect();
    }
  });
} catch {
  await finish();
  process.send?.({ type: 'failed', code: 'FIXTURE_START_FAILED' });
  process.exitCode = 1;
  process.disconnect?.();
}
