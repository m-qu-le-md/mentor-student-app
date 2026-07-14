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
const { startOfHcmWeek, endOfHcmWeek, ALGORITHM_VERSION } = require('../services/gamificationService');

const CONFIRMATION = 'SEED_PROJECT_001_TEST_DATA';
const TAG = 'project001-test';
const PREFIX = '[TEST 001]';
const DAY_MS = 24 * 60 * 60 * 1000;

const addDays = (days, hour = 20) => {
  const value = new Date();
  value.setDate(value.getDate() + days);
  value.setHours(hour, 0, 0, 0);
  return value;
};

const atWeekDay = (weekStart, day, hour = 12) => new Date(weekStart.getTime() + day * DAY_MS + hour * 60 * 60 * 1000);

async function removePreviousSeed() {
  await Promise.all([
    Task.deleteMany({ title: { $regex: `^\\${PREFIX}` } }),
    Evaluation.deleteMany({ mentorFeedback: { $regex: `^\\${PREFIX}` } }),
    XpLedger.deleteMany({ 'metadata.seed': TAG }),
    WeeklyGoal.deleteMany({ $or: [
      { 'algorithmSnapshot.seed': TAG },
      { status: 'active', earnedXp: 0, taskXp: 0 },
    ] }),
    AchievementUnlock.deleteMany({ 'metadata.seed': TAG }),
  ]);
}

async function assertSafeDatabase() {
  const [tasks, evaluations, ledgers, goals, achievements] = await Promise.all([
    Task.countDocuments({ title: { $not: { $regex: `^\\${PREFIX}` } } }),
    Evaluation.countDocuments({ mentorFeedback: { $not: { $regex: `^\\${PREFIX}` } } }),
    XpLedger.countDocuments({ 'metadata.seed': { $ne: TAG } }),
    WeeklyGoal.countDocuments({
      'algorithmSnapshot.seed': { $ne: TAG },
      $or: [{ earnedXp: { $gt: 0 } }, { taskXp: { $gt: 0 } }, { status: 'settled' }],
    }),
    AchievementUnlock.countDocuments({ 'metadata.seed': { $ne: TAG } }),
  ]);
  if (tasks + evaluations + ledgers + goals + achievements > 0) {
    throw new Error('Database có dữ liệu không thuộc bộ TEST 001. Script từ chối ghi đè; hãy dùng database sạch hoặc reset có kiểm soát.');
  }
}

async function seed() {
  if (!process.env.MONGO_URI) throw new Error('Thiếu MONGO_URI.');
  if (process.env.PROJECT001_SEED_CONFIRM !== CONFIRMATION) throw new Error(`Từ chối seed: cần PROJECT001_SEED_CONFIRM=${CONFIRMATION}.`);
  await connectDB();
  console.log(`Database đích: ${mongoose.connection.name}`);
  await assertSafeDatabase();
  await removePreviousSeed();

  const ideas = await BoardColumn.findOneAndUpdate({ title: 'Ý tưởng' }, { $setOnInsert: { title: 'Ý tưởng', position: 0 } }, { upsert: true, returnDocument: 'after' });
  const ready = await BoardColumn.findOneAndUpdate({ title: 'Sẵn sàng' }, { $setOnInsert: { title: 'Sẵn sàng', position: 1 } }, { upsert: true, returnDocument: 'after' });
  const thisWeek = await BoardColumn.findOneAndUpdate({ title: 'Tuần này' }, { $setOnInsert: { title: 'Tuần này', position: 2 } }, { upsert: true, returnDocument: 'after' });

  const completedAt = addDays(-1, 19);
  const completedTask = await Task.create({
    title: `${PREFIX} Tóm tắt cơ chế điều hòa huyết áp`, size: 'medium', dueDate: addDays(-1, 21), flag: null,
    notes: 'Đã hoàn thành đúng hạn để minh họa lịch sử và XP.', lifecycle: 'assigned', status: 'completed',
    completedAt, xpAwarded: 50,
  });

  await Task.insertMany([
    { title: `${PREFIX} Ôn sinh lý tim mạch`, size: 'medium', dueDate: new Date(Date.now() + 23 * 60 * 60 * 1000), flag: 'red', notes: 'Đọc tài liệu, vẽ lại chu kỳ tim và tóm tắt trong 300–500 từ.', resourceLinks: [{ label: 'Tài liệu sinh lý tim mạch', url: 'https://www.ncbi.nlm.nih.gov/books/NBK538143/' }], lifecycle: 'assigned', status: 'pending' },
    { title: `${PREFIX} Làm 20 câu ECG cơ bản`, size: 'small', dueDate: addDays(1), flag: 'yellow', notes: 'Ghi lại các câu sai và lý do chọn đáp án.', lifecycle: 'assigned', status: 'pending' },
    { title: `${PREFIX} Lập sơ đồ chẩn đoán đau ngực`, size: 'large', dueDate: addDays(3), flag: null, notes: 'Ưu tiên các dấu hiệu cần xử trí khẩn cấp.', lifecycle: 'assigned', status: 'pending' },
    { title: `${PREFIX} Ôn nhóm kháng sinh beta-lactam`, size: 'medium', dueDate: addDays(5), flag: null, lifecycle: 'assigned', status: 'pending' },
    { title: `${PREFIX} Bài quiz nội tiết đã lỡ hạn`, size: 'small', dueDate: addDays(-2), flag: 'yellow', lifecycle: 'assigned', status: 'failed' },
    { title: `${PREFIX} Tổng hợp flashcard giải phẫu tim`, lifecycle: 'planned', boardColumnId: ideas._id, boardPosition: 0 },
    { title: `${PREFIX} Xem lại cơ chế sốc phản vệ`, lifecycle: 'planned', boardColumnId: ideas._id, boardPosition: 1 },
    { title: `${PREFIX} Tóm tắt chỉ số khí máu động mạch`, lifecycle: 'planned', boardColumnId: ready._id, boardPosition: 0 },
    { title: `${PREFIX} Chuẩn bị 30 câu dược lý`, lifecycle: 'planned', boardColumnId: ready._id, boardPosition: 1 },
    { title: `${PREFIX} Đọc ca lâm sàng suy tim`, lifecycle: 'planned', boardColumnId: thisWeek._id, boardPosition: 0 },
  ]);

  const currentStart = startOfHcmWeek(new Date());
  const previousTwoStart = new Date(currentStart.getTime() - 14 * DAY_MS);
  const previousStart = new Date(currentStart.getTime() - 7 * DAY_MS);
  const weekXp = [
    { start: previousTwoStart, values: [50, 50, 20, 100, 50, 20, 50], target: 300, tier: 'stable' },
    { start: previousStart, values: [50, 100, 50, 20, 50, 100, 50], target: 360, tier: 'balanced' },
  ];
  const ledgerEntries = [];
  weekXp.forEach((week, weekIndex) => week.values.forEach((xp, day) => ledgerEntries.push({
    sourceType: 'task_completion',
    sourceId: weekIndex === 1 && day === 6 ? completedTask._id : new mongoose.Types.ObjectId(),
    xp, earnedAt: weekIndex === 1 && day === 6 ? completedAt : atWeekDay(week.start, day),
    taskDueDate: atWeekDay(week.start, day, 20), onTime: true, countsTowardBaseline: true,
    metadata: { seed: TAG, size: xp === 20 ? 'small' : xp === 100 ? 'large' : 'medium' },
  })));

  const previousTwoTaskXp = weekXp[0].values.reduce((sum, xp) => sum + xp, 0);
  const previousTaskXp = weekXp[1].values.reduce((sum, xp) => sum + xp, 0);
  const bonusOne = Math.min(100, Math.round(weekXp[0].target * 0.1));
  const bonusTwo = Math.min(100, Math.round(weekXp[1].target * 0.1));

  const pastGoals = await WeeklyGoal.insertMany(weekXp.map((week, index) => ({
    weekStart: week.start, weekEnd: endOfHcmWeek(week.start), targetXp: week.target,
    earnedXp: index === 0 ? previousTwoTaskXp + bonusOne : previousTaskXp + bonusTwo,
    taskXp: index === 0 ? previousTwoTaskXp : previousTaskXp, tier: week.tier,
    recommendedTier: week.tier, locked: true, status: 'settled', weeklyBonus: index === 0 ? bonusOne : bonusTwo,
    algorithmVersion: ALGORITHM_VERSION, explanation: `${PREFIX} Tuần lịch sử dùng để minh họa adaptive goal.`,
    algorithmSnapshot: { seed: TAG, calibrated: true, baselineXp: 350 },
  })));

  ledgerEntries.push(
    { sourceType: 'weekly_bonus', sourceId: pastGoals[0]._id, xp: bonusOne, earnedAt: pastGoals[0].weekEnd, countsTowardBaseline: false, metadata: { seed: TAG } },
    { sourceType: 'weekly_bonus', sourceId: pastGoals[1]._id, xp: bonusTwo, earnedAt: pastGoals[1].weekEnd, countsTowardBaseline: false, metadata: { seed: TAG } },
  );
  await XpLedger.insertMany(ledgerEntries);

  await WeeklyGoal.create({
    weekStart: currentStart, weekEnd: endOfHcmWeek(currentStart), targetXp: 400, earnedXp: 0, taskXp: 0,
    tier: 'balanced', recommendedTier: 'balanced', locked: false, status: 'active', algorithmVersion: ALGORITHM_VERSION,
    explanation: 'Dựa trên P60 của 14 ngày học gần nhất; tier Cân bằng được khuyến nghị.',
    algorithmSnapshot: {
      seed: TAG, calibrated: true, opportunityDays: 14, completedWeeks: 2, p60DailyXp: 50,
      p60ActiveDays: 7, baselineXp: 350, recommendedTier: 'balanced',
      targets: { stable: 350, balanced: 380, breakthrough: 400 },
    },
  });

  const totalXp = previousTwoTaskXp + previousTaskXp + bonusOne + bonusTwo;
  await GamificationProfile.findOneAndUpdate(
    { key: 'default' },
    { $set: { totalXp, currentWeeklyStreak: 2, longestWeeklyStreak: 2, timezone: 'Asia/Ho_Chi_Minh', calibrationStartedAt: previousTwoStart } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
  await AchievementUnlock.insertMany([
    { code: 'first-task', metadata: { seed: TAG, completed: 14 } },
    { code: 'ontime-10', metadata: { seed: TAG, onTime: 14 } },
  ]);
  await Evaluation.insertMany([
    { weekStart: previousTwoStart, weekEnd: endOfHcmWeek(previousTwoStart), mentorRating: 4, mentorFeedback: `${PREFIX} Bạn giữ nhịp học đều và hoàn thành phần tim mạch đúng hạn. Tuần tới hãy ghi rõ hơn lý do ở các câu ECG sai.` },
    { weekStart: previousStart, weekEnd: endOfHcmWeek(previousStart), mentorRating: 5, mentorFeedback: `${PREFIX} Khả năng liên kết sinh lý với ca lâm sàng đã tốt hơn. Hãy giữ một phiên ôn ngắn vào cuối tuần để củng cố.` },
    { weekStart: currentStart, weekEnd: endOfHcmWeek(currentStart), mentorRating: 4, mentorFeedback: `${PREFIX} Mục tiêu tuần này là ưu tiên task tim mạch trước, sau đó mới mở rộng sang dược lý.` },
  ]);

  const counts = {
    tasks: await Task.countDocuments({ title: { $regex: `^\\${PREFIX}` } }),
    columns: await BoardColumn.countDocuments(), evaluations: await Evaluation.countDocuments({ mentorFeedback: { $regex: `^\\${PREFIX}` } }),
    goals: await WeeklyGoal.countDocuments({ 'algorithmSnapshot.seed': TAG }), ledgers: await XpLedger.countDocuments({ 'metadata.seed': TAG }),
    achievements: await AchievementUnlock.countDocuments({ 'metadata.seed': TAG }), totalXp,
  };
  console.log(JSON.stringify({ project: '001', testData: true, counts }, null, 2));
}

if (require.main === module) {
  seed().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(async () => mongoose.disconnect());
}

module.exports = { seed, PREFIX, TAG, CONFIRMATION };
