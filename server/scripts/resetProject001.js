require('dotenv').config();
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Task = require('../models/Task');
const BoardColumn = require('../models/BoardColumn');
const Evaluation = require('../models/Evaluation');
const GamificationProfile = require('../models/GamificationProfile');
const WeeklyGoal = require('../models/WeeklyGoal');
const XpLedger = require('../models/XpLedger');
const AchievementUnlock = require('../models/AchievementUnlock');
const PushSubscription = require('../models/PushSubscription');
const NotificationEvent = require('../models/NotificationEvent');

const collections = { Task, BoardColumn, Evaluation, GamificationProfile, WeeklyGoal, XpLedger, AchievementUnlock, PushSubscription, NotificationEvent };
const dryRun = process.argv.includes('--dry-run');

async function backup() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const directory = path.join(os.tmpdir(), `StudyMed-Project001-data-${stamp}`);
  await fs.mkdir(directory, { recursive: true });
  const manifest = {};
  for (const [name, Model] of Object.entries(collections)) {
    const content = `${JSON.stringify(await Model.find().lean(), null, 2)}\n`;
    const file = path.join(directory, `${name}.json`);
    await fs.writeFile(file, content, 'utf8');
    manifest[name] = { file, count: JSON.parse(content).length, sha256: crypto.createHash('sha256').update(content).digest('hex').toUpperCase() };
  }
  await fs.writeFile(path.join(directory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return { directory, manifest };
}

async function reset() {
  if (!process.env.MONGO_URI) throw new Error('Thiếu MONGO_URI.');
  await connectDB();
  const database = mongoose.connection.name;
  console.log(`Database đích: ${database}`);
  const result = await backup();
  console.log(`Backup JSON: ${result.directory}`);
  Object.entries(result.manifest).forEach(([name, item]) => console.log(`${name}: ${item.count} record, SHA-256 ${item.sha256}`));
  if (dryRun) { console.log('DRY RUN hoàn tất — chưa xóa dữ liệu.'); return; }
  if (process.env.PROJECT001_RESET_CONFIRM !== 'RESET_PROJECT_001') throw new Error('Từ chối reset: PROJECT001_RESET_CONFIRM chưa đúng chuỗi RESET_PROJECT_001.');
  await Promise.all(Object.values(collections).map((Model) => Model.deleteMany({})));
  await GamificationProfile.create({ key: 'default', totalXp: 0, currentWeeklyStreak: 0, longestWeeklyStreak: 0 });
  await BoardColumn.insertMany([{ title: 'Ý tưởng', position: 0 }, { title: 'Sẵn sàng', position: 1 }]);
  console.log('Cutover Project 001 hoàn tất: dữ liệu sạch, hai cột mặc định, không seed mẫu.');
}

reset().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(async () => mongoose.disconnect());
