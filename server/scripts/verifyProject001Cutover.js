require('dotenv').config();
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

async function verify() {
  await connectDB();
  const counts = {
    Task: await Task.countDocuments(), Evaluation: await Evaluation.countDocuments(),
    WeeklyGoal: await WeeklyGoal.countDocuments(), XpLedger: await XpLedger.countDocuments(),
    AchievementUnlock: await AchievementUnlock.countDocuments(), PushSubscription: await PushSubscription.countDocuments(),
    GamificationProfile: await GamificationProfile.countDocuments(), BoardColumn: await BoardColumn.countDocuments(),
  };
  const columns = await BoardColumn.find().sort({ position: 1 }).select('title -_id').lean();
  const expectedZero = ['Task', 'Evaluation', 'WeeklyGoal', 'XpLedger', 'AchievementUnlock', 'PushSubscription'];
  const valid = expectedZero.every((key) => counts[key] === 0) && counts.GamificationProfile === 1 && counts.BoardColumn === 2 && columns.map((item) => item.title).join('|') === 'Ý tưởng|Sẵn sàng';
  console.log(JSON.stringify({ database: mongoose.connection.name, counts, columns, valid }, null, 2));
  if (!valid) process.exitCode = 1;
}
verify().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(async () => mongoose.disconnect());
