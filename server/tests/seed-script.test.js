const test = require('node:test');
const assert = require('node:assert/strict');
const { promisify } = require('node:util');
const { execFile } = require('node:child_process');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Task = require('../models/Task');
const WeeklyGoal = require('../models/WeeklyGoal');
const XpLedger = require('../models/XpLedger');
const GamificationProfile = require('../models/GamificationProfile');
const { startOfHcmWeek, endOfHcmWeek } = require('../services/gamificationService');

const run = promisify(execFile);

test('seed Project 001 tạo bộ dữ liệu đầy đủ và chạy lại không nhân bản', async () => {
  const mongo = await MongoMemoryServer.create();
  const env = { ...process.env, MONGO_URI: mongo.getUri(), PROJECT001_SEED_CONFIRM: 'SEED_PROJECT_001_TEST_DATA' };
  try {
    await mongoose.connect(mongo.getUri());
    const currentStart = startOfHcmWeek(new Date());
    await WeeklyGoal.create({ weekStart: currentStart, weekEnd: endOfHcmWeek(currentStart), targetXp: 200, earnedXp: 0, taskXp: 0, tier: 'calibration', status: 'active' });
    await GamificationProfile.create({ key: 'default', totalXp: 0 });
    await mongoose.disconnect();
    const first = await run(process.execPath, ['scripts/seedProject001TestData.js'], { cwd: process.cwd(), env });
    assert.match(first.stdout, /"testData": true/);
    const second = await run(process.execPath, ['scripts/seedProject001TestData.js'], { cwd: process.cwd(), env });
    assert.match(second.stdout, /"tasks": 11/);
    await mongoose.connect(mongo.getUri());
    assert.equal(await Task.countDocuments(), 11);
    assert.equal(await WeeklyGoal.countDocuments(), 3);
    assert.equal(await XpLedger.countDocuments(), 16);
    const profile = await GamificationProfile.findOne({ key: 'default' });
    assert.equal(profile.totalXp, 826);
    assert.equal((await Task.find({ lifecycle: 'planned' })).length, 5);
  } finally {
    if (mongoose.connection.readyState) await mongoose.disconnect();
    await mongo.stop();
  }
});
