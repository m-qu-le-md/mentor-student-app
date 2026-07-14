const GamificationProfile = require('../models/GamificationProfile');
const WeeklyGoal = require('../models/WeeklyGoal');
const XpLedger = require('../models/XpLedger');
const AchievementUnlock = require('../models/AchievementUnlock');
const Task = require('../models/Task');

const HCM_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const TASK_XP = Object.freeze({ small: 20, medium: 50, large: 100 });
const TIER_MULTIPLIER = Object.freeze({ stable: 1, balanced: 1.075, breakthrough: 1.15 });
const ALGORITHM_VERSION = 'project-001-v1';

const startOfHcmWeek = (value = new Date()) => {
  const shifted = new Date(new Date(value).getTime() + HCM_OFFSET_MS);
  const day = shifted.getUTCDay() || 7;
  shifted.setUTCDate(shifted.getUTCDate() - day + 1);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - HCM_OFFSET_MS);
};

const endOfHcmWeek = (value = new Date()) => new Date(startOfHcmWeek(value).getTime() + 7 * DAY_MS - 1);
const hcmDateKey = (value) => new Date(new Date(value).getTime() + HCM_OFFSET_MS).toISOString().slice(0, 10);

const percentile = (values, rank = 0.6) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * rank) - 1)];
};

const roundToTen = (value) => Math.max(10, Math.round(value / 10) * 10);
const capTarget = (rawTarget, previousTarget) => {
  if (!previousTarget) return roundToTen(rawTarget);
  const upper = Math.floor((previousTarget * 1.15 + Number.EPSILON * 1000) / 10) * 10;
  const lower = Math.ceil(previousTarget * 0.9 / 10) * 10;
  return Math.min(upper, Math.max(lower, roundToTen(rawTarget)));
};

const calculateLevel = (totalXp = 0) => {
  let level = 1;
  let remaining = Math.max(0, totalXp);
  let threshold = 200;
  while (remaining >= threshold) {
    remaining -= threshold;
    level += 1;
    threshold = 200 + 50 * (level - 1);
  }
  return { current: level, xpIntoLevel: remaining, xpForNext: threshold };
};

const getProfile = () => GamificationProfile.findOneAndUpdate(
  { key: 'default' },
  { $setOnInsert: { key: 'default' } },
  { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
);

const calculateAdaptiveGoal = async (at = new Date()) => {
  const currentStart = startOfHcmWeek(at);
  const windowStart = new Date(currentStart.getTime() - 8 * 7 * DAY_MS);
  const recoveryWeeks = await WeeklyGoal.find({ recovery: true, weekStart: { $gte: windowStart, $lt: currentStart } }).select('weekStart').lean();
  const recoveryKeys = new Set(recoveryWeeks.map((week) => week.weekStart.toISOString()));
  const ledgers = await XpLedger.find({
    sourceType: 'task_completion', countsTowardBaseline: true,
    earnedAt: { $gte: windowStart, $lt: currentStart },
  }).sort({ earnedAt: 1 }).lean();

  const included = ledgers.filter((entry) => !recoveryKeys.has(startOfHcmWeek(entry.earnedAt).toISOString()));
  const daily = new Map();
  const weeklyDays = new Map();
  included.forEach((entry) => {
    const day = hcmDateKey(entry.earnedAt);
    const week = startOfHcmWeek(entry.earnedAt).toISOString();
    daily.set(day, (daily.get(day) || 0) + entry.xp);
    if (!weeklyDays.has(week)) weeklyDays.set(week, new Set());
    weeklyDays.get(week).add(day);
  });

  const opportunityDays = daily.size;
  const completedWeeks = weeklyDays.size;
  const calibrated = opportunityDays >= 14 && completedWeeks >= 2;
  const p60DailyXp = percentile([...daily.values()]);
  const p60ActiveDays = percentile([...weeklyDays.values()].map((days) => days.size));
  const baselineXp = calibrated ? roundToTen(p60DailyXp * p60ActiveDays) : 200;
  const recentWeek = await WeeklyGoal.findOne({ weekStart: { $lt: currentStart }, recovery: false, status: 'settled' }).sort({ weekStart: -1 }).lean();
  const completionRatio = recentWeek ? recentWeek.taskXp / Math.max(recentWeek.targetXp, 1) : 0;
  const recommendedTier = completionRatio >= 1.08 ? 'breakthrough' : completionRatio >= 0.85 ? 'balanced' : 'stable';
  const previousGoal = await WeeklyGoal.findOne({ weekStart: { $lt: currentStart }, recovery: false }).sort({ weekStart: -1 }).lean();

  const targetFor = (tier) => {
    const raw = baselineXp * TIER_MULTIPLIER[tier];
    return capTarget(raw, previousGoal?.targetXp);
  };

  return {
    calibrated, opportunityDays, completedWeeks, p60DailyXp, p60ActiveDays, baselineXp,
    recommendedTier, targetXp: calibrated ? targetFor(recommendedTier) : 200,
    targets: { stable: targetFor('stable'), balanced: targetFor('balanced'), breakthrough: targetFor('breakthrough') },
    windowStart, windowEnd: new Date(currentStart.getTime() - 1), algorithmVersion: ALGORITHM_VERSION,
  };
};

const getOrCreateGoal = async (at = new Date()) => {
  const weekStart = startOfHcmWeek(at);
  let goal = await WeeklyGoal.findOne({ weekStart });
  if (!goal) {
    const snapshot = await calculateAdaptiveGoal(at);
    const tier = snapshot.calibrated ? snapshot.recommendedTier : 'calibration';
    const explanation = snapshot.calibrated
      ? `Dựa trên P60 của ${snapshot.opportunityDays} ngày học và tier ${tier}.`
      : `Đang hiệu chuẩn: ${snapshot.opportunityDays}/14 ngày và ${snapshot.completedWeeks}/2 tuần có dữ liệu.`;
    try {
      goal = await WeeklyGoal.create({
        weekStart, weekEnd: endOfHcmWeek(at), targetXp: snapshot.targetXp, tier,
        recommendedTier: snapshot.recommendedTier, explanation, algorithmVersion: ALGORITHM_VERSION,
        algorithmSnapshot: snapshot,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      goal = await WeeklyGoal.findOne({ weekStart });
    }
  }
  return goal;
};

const achievementCatalog = [
  { code: 'first-task', title: 'Bước đầu tiên', description: 'Hoàn thành nhiệm vụ đầu tiên.', target: 1, metric: 'completed' },
  { code: 'ontime-10', title: 'Đúng nhịp 10', description: 'Hoàn thành đúng hạn 10 nhiệm vụ.', target: 10, metric: 'onTime' },
  { code: 'ontime-50', title: 'Đúng nhịp 50', description: 'Hoàn thành đúng hạn 50 nhiệm vụ.', target: 50, metric: 'onTime' },
  { code: 'ontime-100', title: 'Đúng nhịp 100', description: 'Hoàn thành đúng hạn 100 nhiệm vụ.', target: 100, metric: 'onTime' },
  { code: 'streak-3', title: 'Ba tuần bền bỉ', description: 'Giữ weekly streak trong 3 tuần.', target: 3, metric: 'streak' },
  { code: 'streak-8', title: 'Tám tuần vững vàng', description: 'Giữ weekly streak trong 8 tuần.', target: 8, metric: 'streak' },
  { code: 'streak-12', title: 'Mười hai tuần sâu rễ', description: 'Giữ weekly streak trong 12 tuần.', target: 12, metric: 'streak' },
  { code: 'perfect-week', title: 'Tuần hoàn hảo', description: 'Hoàn thành mọi task đúng hạn trong một tuần.', target: 1, metric: 'special' },
  { code: 'recovery-comeback', title: 'Trở lại mạnh mẽ', description: 'Đạt mục tiêu ở tuần sau recovery.', target: 1, metric: 'special' },
];

const unlock = async (code, metadata = {}) => {
  try { return await AchievementUnlock.create({ code, metadata }); }
  catch (error) { if (error.code === 11000) return null; throw error; }
};

const evaluateTaskAchievements = async () => {
  const [completed, onTime] = await Promise.all([
    XpLedger.countDocuments({ sourceType: 'task_completion' }),
    XpLedger.countDocuments({ sourceType: 'task_completion', onTime: true }),
  ]);
  const unlocked = [];
  if (completed >= 1) unlocked.push(await unlock('first-task', { completed }));
  for (const threshold of [10, 50, 100]) if (onTime >= threshold) unlocked.push(await unlock(`ontime-${threshold}`, { onTime }));
  return unlocked.filter(Boolean).map((item) => ({ code: item.code, title: achievementCatalog.find((entry) => entry.code === item.code)?.title }));
};

const awardTaskCompletion = async (task, completedAt = new Date()) => {
  const onTime = !task.dueDate || completedAt <= new Date(task.dueDate);
  const baseXp = TASK_XP[task.size] || TASK_XP.medium;
  const xp = onTime ? baseXp : baseXp / 2;
  let ledger;
  let created = false;
  try {
    ledger = await XpLedger.create({ sourceType: 'task_completion', sourceId: task._id, xp, earnedAt: completedAt, taskDueDate: task.dueDate, onTime, countsTowardBaseline: true, metadata: { size: task.size } });
    created = true;
  } catch (error) {
    if (error.code !== 11000) throw error;
    ledger = await XpLedger.findOne({ sourceType: 'task_completion', sourceId: task._id });
  }

  const profileBefore = await getProfile();
  const beforeLevel = calculateLevel(profileBefore.totalXp);
  const goal = await getOrCreateGoal(completedAt);
  if (created) {
    await Promise.all([
      GamificationProfile.updateOne({ _id: profileBefore._id }, { $inc: { totalXp: ledger.xp } }),
      WeeklyGoal.updateOne({ _id: goal._id }, { $inc: { earnedXp: ledger.xp, taskXp: ledger.xp }, $set: { locked: true } }),
    ]);
  }
  const profileAfter = await getProfile();
  const refreshedGoal = await WeeklyGoal.findById(goal._id);
  const afterLevel = calculateLevel(profileAfter.totalXp);
  const achievements = created ? await evaluateTaskAchievements() : [];
  return {
    created, xpAwarded: ledger.xp, isLate: !ledger.onTime,
    level: { ...afterLevel, changed: afterLevel.current > beforeLevel.current },
    week: { earnedXp: refreshedGoal.earnedXp, targetXp: refreshedGoal.targetXp },
    achievements,
  };
};

const settlePastGoals = async (at = new Date()) => {
  const currentStart = startOfHcmWeek(at);
  const goals = await WeeklyGoal.find({ status: 'active', weekEnd: { $lt: currentStart } }).sort({ weekStart: 1 });
  for (const goal of goals) {
    const profile = await getProfile();
    const achieved = goal.earnedXp >= goal.targetXp;
    const bonus = achieved ? Math.min(100, Math.round(goal.targetXp * 0.1 * (goal.recovery ? 0.5 : 1))) : 0;
    if (bonus) {
      try {
        await XpLedger.create({ sourceType: 'weekly_bonus', sourceId: goal._id, xp: bonus, earnedAt: goal.weekEnd, countsTowardBaseline: false });
        await GamificationProfile.updateOne({ _id: profile._id }, { $inc: { totalXp: bonus } });
      } catch (error) { if (error.code !== 11000) throw error; }
    }
    if (!goal.recovery && goal.tier !== 'calibration') {
      const nextStreak = achieved ? profile.currentWeeklyStreak + 1 : 0;
      await GamificationProfile.updateOne({ _id: profile._id }, { $set: { currentWeeklyStreak: nextStreak }, $max: { longestWeeklyStreak: nextStreak } });
      for (const threshold of [3, 8, 12]) if (nextStreak >= threshold) await unlock(`streak-${threshold}`, { streak: nextStreak });
    }
    if (achieved) {
      const dueTasks = await Task.find({ lifecycle: 'assigned', dueDate: { $gte: goal.weekStart, $lte: goal.weekEnd } }).select('status dueDate completedAt').lean();
      if (dueTasks.length && dueTasks.every((task) => task.status === 'completed' && task.completedAt && task.completedAt <= task.dueDate)) await unlock('perfect-week', { weekStart: goal.weekStart });
      const previous = await WeeklyGoal.findOne({ weekStart: { $lt: goal.weekStart } }).sort({ weekStart: -1 }).lean();
      if (previous?.recovery) await unlock('recovery-comeback', { weekStart: goal.weekStart });
    }
    goal.status = 'settled'; goal.weeklyBonus = bonus; await goal.save();
  }
};

const getDashboard = async () => {
  await settlePastGoals();
  const [profile, goal, unlocked, completed, onTime] = await Promise.all([getProfile(), getOrCreateGoal(), AchievementUnlock.find().lean(), XpLedger.countDocuments({ sourceType: 'task_completion' }), XpLedger.countDocuments({ sourceType: 'task_completion', onTime: true })]);
  const level = calculateLevel(profile.totalXp);
  const unlockedMap = new Map(unlocked.map((item) => [item.code, item]));
  const achievements = achievementCatalog.map((item) => ({ ...item, unlockedAt: unlockedMap.get(item.code)?.unlockedAt || null, progress: item.metric === 'completed' ? completed : item.metric === 'onTime' ? onTime : item.metric === 'streak' ? profile.currentWeeklyStreak : unlockedMap.has(item.code) ? 1 : 0 }));
  return {
    profile: { totalXp: profile.totalXp, currentWeeklyStreak: profile.currentWeeklyStreak, longestWeeklyStreak: profile.longestWeeklyStreak, ...level },
    week: { targetXp: goal.targetXp, earnedXp: goal.earnedXp, taskXp: goal.taskXp, percentage: Math.min(100, Math.round(goal.earnedXp / goal.targetXp * 100)), tier: goal.tier, tierLabel: goal.tier === 'calibration' ? 'Hiệu chuẩn' : { stable: 'Ổn định', balanced: 'Cân bằng', breakthrough: 'Bứt phá' }[goal.tier], reason: goal.explanation, recovery: goal.recovery, locked: goal.locked },
    achievements,
  };
};

const getAlgorithmExplanation = async () => {
  const goal = await getOrCreateGoal();
  const snapshot = goal.algorithmSnapshot || {};
  return { version: goal.algorithmVersion, summary: goal.explanation, window: 'Tối đa 28 ngày có task trong 8 tuần gần nhất; loại tuần recovery.', baselineXp: snapshot.baselineXp || 0, opportunityDays: snapshot.opportunityDays || 0, completedWeeks: snapshot.completedWeeks || 0, p60DailyXp: snapshot.p60DailyXp || 0, p60ActiveDays: snapshot.p60ActiveDays || 0, tier: goal.tier, targets: snapshot.targets || {}, caps: { increase: 0.15, decrease: 0.1 }, timezone: 'Asia/Ho_Chi_Minh' };
};

const updateCurrentGoal = async ({ tier, recovery }) => {
  const goal = await getOrCreateGoal();
  if (goal.locked) throw Object.assign(new Error('Mục tiêu đã khóa sau khi nhận XP đầu tiên trong tuần.'), { status: 409 });
  const snapshot = goal.algorithmSnapshot || {};
  if (recovery) {
    const recentRecovery = await WeeklyGoal.exists({ recovery: true, weekStart: { $gte: new Date(goal.weekStart.getTime() - 4 * 7 * DAY_MS), $lt: goal.weekStart } });
    if (recentRecovery) throw Object.assign(new Error('Recovery chỉ được dùng một lần trong bốn tuần.'), { status: 409 });
    goal.recovery = true;
  }
  if (tier) {
    if (!['stable', 'balanced', 'breakthrough'].includes(tier)) throw Object.assign(new Error('Tier không hợp lệ.'), { status: 400 });
    if (!snapshot.calibrated) throw Object.assign(new Error('Chưa thể chọn tier trong giai đoạn hiệu chuẩn.'), { status: 409 });
    goal.tier = tier; goal.targetXp = snapshot.targets?.[tier] || goal.targetXp;
  }
  goal.locked = true;
  await goal.save();
  return goal;
};

module.exports = {
  TASK_XP, ALGORITHM_VERSION, startOfHcmWeek, endOfHcmWeek, hcmDateKey, percentile,
  roundToTen, capTarget, calculateLevel, calculateAdaptiveGoal, getProfile, getOrCreateGoal,
  awardTaskCompletion, settlePastGoals, getDashboard, getAlgorithmExplanation, updateCurrentGoal,
};
