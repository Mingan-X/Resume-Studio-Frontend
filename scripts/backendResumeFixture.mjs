import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backend = path.resolve(frontend, '../Resume-Studio-Backend');
const runRoot = path.resolve(process.argv[2] ?? '');
const parent = path.join(frontend, '.smoke-runs');
assert.ok(
  path.relative(parent, runRoot) &&
    !path.relative(parent, runRoot).startsWith('..') &&
    !path.isAbsolute(path.relative(parent, runRoot)),
);
process.chdir(backend);
process.loadEnvFile(path.join(backend, 'infra/.env'));
const requireBackend = createRequire(path.join(backend, 'package.json'));
requireBackend('reflect-metadata');
const { Test } = requireBackend('@nestjs/testing');
const load = (relative) => import(pathToFileURL(path.join(backend, 'dist', relative)).href);
const { ownedPostgres } = await load('src/infrastructure/checkpoint/ownership.js');
const { loadInfrastructureConfig } = await load('src/infrastructure/config.js');
const { DatabaseService } = await load('src/infrastructure/database/database.service.js');
const { ApiModule } = await load('src/app-api.module.js');
const { ResumeApiModule } = await load('src/modules/resumes/resume-api.module.js');
const { configureHttp } = await load('src/bootstrap-api.js');
const { loadConfig } = await load('src/modules/config/app-config.js');
const { IDENTITY } = await load('src/modules/identity/identity.module.js');
const { syntheticPdf, syntheticZip, minimalDocxEntries } = await load(
  'test/support/document-fixtures.js',
);
await ownedPostgres();
const database = new DatabaseService(loadInfrastructureConfig(process.env));
const db = database.client,
  ownerId = randomUUID();
let app,
  ownerCreated = false,
  finished = false;
await writeFile(
  path.join(runRoot, 'manifest.json'),
  JSON.stringify({
    ownerId,
    backendSha: 'b2104ea374ba6bc9f1da799033c7f37d5ab80153',
    state: 'starting',
  }),
);
async function finish() {
  if (finished) return;
  finished = true;
  try {
    if (app) await app.close();
    if (ownerCreated) {
      await ownedPostgres();
      assert.equal(
        await db.resourceOperation.count({ where: { ownerId, stoppedAt: null } }),
        0,
        'upload stop unconfirmed',
      );
      await db.$transaction(async (tx) => {
        const where = { ownerId };
        await tx.resumeUpload.deleteMany({ where });
        await tx.extractedDocument.deleteMany({ where });
        await tx.evidenceBlock.deleteMany({ where });
        await tx.resumeVersion.deleteMany({ where });
        await tx.resume.deleteMany({ where });
        await tx.fileAsset.deleteMany({ where });
        await tx.owner.delete({ where: { id: ownerId } });
      });
      assert.equal(await db.owner.count({ where: { id: ownerId } }), 0);
    }
    await writeFile(
      path.join(runRoot, 'manifest.json'),
      JSON.stringify({ ownerId, state: 'cleaned' }),
    );
  } finally {
    await database.onModuleDestroy();
  }
}
try {
  await db.owner.create({ data: { id: ownerId } });
  ownerCreated = true;
  const storageRoot = path.join(runRoot, 'storage');
  await mkdir(storageRoot);
  const module = await Test.createTestingModule({
    imports: [
      ApiModule.register(loadConfig('api', { APP_ENV: 'development', HTTP_PORT: '3000' }), [
        ResumeApiModule.register({
          databaseUrl: loadInfrastructureConfig(process.env).databaseUrl,
          storageRoot,
        }),
      ]),
    ],
  })
    .overrideProvider(IDENTITY)
    .useValue({ getOwnerId: async () => ownerId })
    .compile();
  app = module.createNestApplication({ logger: false });
  configureHttp(app);
  await app.listen(3000, '127.0.0.1');
  for (const [name, bytes] of [
    ['valid.pdf', syntheticPdf([{ text: '合成简历：工程测试与交付' }])],
    ['valid.docx', syntheticZip(minimalDocxEntries())],
    ['scanned.pdf', syntheticPdf([{ image: true }])],
    ['encrypted.pdf', syntheticPdf([{ text: '合成加密文件' }], true)],
  ])
    await writeFile(path.join(runRoot, name), bytes);
  process.send?.({ type: 'ready', runRoot });
  process.on('message', async (message) => {
    if (message?.type !== 'stop') return;
    try {
      await finish();
      process.send?.({ type: 'cleaned' });
      process.disconnect();
    } catch {
      process.send?.({ type: 'failed', code: 'CLEANUP_UNCONFIRMED' });
      process.exitCode = 1;
      process.disconnect();
    }
  });
} catch {
  try {
    await finish();
  } catch {
    process.exitCode = 1;
  }
  process.send?.({ type: 'failed', code: 'START_FAILED' });
  process.exitCode = 1;
  process.disconnect?.();
}
