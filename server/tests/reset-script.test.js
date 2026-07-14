const test = require('node:test');
const assert = require('node:assert/strict');
const { promisify } = require('node:util');
const { execFile } = require('node:child_process');
const { MongoMemoryServer } = require('mongodb-memory-server');

const run = promisify(execFile);

test('reset Project 001 dry-run backup được và không cần confirmation', async () => {
  const mongo = await MongoMemoryServer.create();
  try {
    const result = await run(process.execPath, ['scripts/resetProject001.js', '--dry-run'], { cwd: process.cwd(), env: { ...process.env, MONGO_URI: mongo.getUri(), PROJECT001_RESET_CONFIRM: '' } });
    assert.match(result.stdout, /Database đích:/); assert.match(result.stdout, /Backup JSON:/); assert.match(result.stdout, /DRY RUN hoàn tất/);
  } finally { await mongo.stop(); }
});
