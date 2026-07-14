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
const { getRecommendedTask } = require('../services/recommendationService');
const PREFIX = '[TEST 001]';
const TAG = 'project001-test';

async function verify() {
  await connectDB();
  const [profile, counts, pending, planned, columns, recommended] = await Promise.all([
    GamificationProfile.findOne({ key: 'default' }).lean(),
    Promise.all([
      Task.countDocuments({ title: { $regex: `^\\${PREFIX}` } }),
      Evaluation.countDocuments({ mentorFeedback: { $regex: `^\\${PREFIX}` } }),
      WeeklyGoal.countDocuments({ 'algorithmSnapshot.seed': TAG }),
      XpLedger.countDocuments({ 'metadata.seed': TAG }),
      AchievementUnlock.countDocuments({ 'metadata.seed': TAG }),
    ]),
    Task.countDocuments({ title: { $regex: `^\\${PREFIX}` }, lifecycle: 'assigned', status: 'pending' }),
    Task.countDocuments({ title: { $regex: `^\\${PREFIX}` }, lifecycle: 'planned' }),
    BoardColumn.find().sort({ position: 1 }).select('title -_id').lean(),
    getRecommendedTask(),
  ]);
  const result = {
    database: mongoose.connection.name,
    counts: { tasks: counts[0], evaluations: counts[1], goals: counts[2], ledgers: counts[3], achievements: counts[4], pending, planned, columns: columns.length },
    profile: { totalXp: profile?.totalXp, weeklyStreak: profile?.currentWeeklyStreak },
    columns,
    recommended: { title: recommended.task?.title, reason: recommended.reason },
  };
  result.valid = counts.join('|') === '11|3|3|16|2' && pending === 4 && planned === 5 && columns.length === 3 && profile?.totalXp === 826;
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) process.exitCode = 1;
}

verify().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(async () => mongoose.disconnect());
