const webPush = require('web-push');
const GamificationProfile = require('../models/GamificationProfile');
const PushSubscription = require('../models/PushSubscription');
const NotificationEvent = require('../models/NotificationEvent');
const Task = require('../models/Task');
const WeeklyGoal = require('../models/WeeklyGoal');
const { getProfile, startOfHcmWeek } = require('./gamificationService');

const HCM_OFFSET_MS = 7 * 60 * 60 * 1000;

const configureWebPush = () => {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return false;
  webPush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@studymed.local', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  return true;
};

const localParts = (value = new Date()) => {
  const shifted = new Date(new Date(value).getTime() + HCM_OFFSET_MS);
  return { date: shifted.toISOString().slice(0, 10), time: shifted.toISOString().slice(11, 16), day: shifted.getUTCDay() };
};

const minutes = (time) => { const [hour, minute] = time.split(':').map(Number); return hour * 60 + minute; };
const isQuietTime = (time, start = '22:00', end = '07:00') => {
  const current = minutes(time); const quietStart = minutes(start); const quietEnd = minutes(end);
  return quietStart > quietEnd ? current >= quietStart || current < quietEnd : current >= quietStart && current < quietEnd;
};

const sendDeduped = async ({ dedupeKey, type, title, body, url }) => {
  let event;
  try { event = await NotificationEvent.create({ dedupeKey, type, payload: { title, body, url } }); }
  catch (error) { if (error.code === 11000) return { sent: 0, duplicate: true }; throw error; }
  const subscriptions = await PushSubscription.find({ active: true }).lean();
  if (!configureWebPush() || !subscriptions.length) { await event.deleteOne(); return { sent: 0, configured: false }; }
  let sent = 0;
  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webPush.sendNotification({ endpoint: subscription.endpoint, keys: subscription.keys }, JSON.stringify({ title, body, url, tag: dedupeKey }));
      sent += 1;
    } catch (error) {
      if ([404, 410].includes(error.statusCode)) await PushSubscription.updateOne({ _id: subscription._id }, { $set: { active: false } });
      else console.error(`Không thể gửi push: ${error.message}`);
    }
  }));
  return { sent };
};

const runNotificationSweep = async (now = new Date()) => {
  const profile = await getProfile();
  const settings = profile.notificationSettings;
  const local = localParts(now);
  if (isQuietTime(local.time, settings.quietStart, settings.quietEnd)) return { skipped: 'quiet-hours' };
  const results = [];
  if (settings.dailyEnabled && local.time === settings.dailyTime) {
    results.push(await sendDeduped({ dedupeKey: `daily:${local.date}`, type: 'daily', title: 'StudyMed — nhịp học hôm nay', body: 'Nhiệm vụ trọng tâm đã sẵn sàng.', url: '/student/today' }));
  }
  if (settings.deadlineEnabled) {
    const lower = new Date(now.getTime() + 119 * 60 * 1000); const upper = new Date(now.getTime() + 121 * 60 * 1000);
    const tasks = await Task.find({ lifecycle: 'assigned', status: 'pending', dueDate: { $gte: lower, $lt: upper } }).select('_id').lean();
    for (const task of tasks) results.push(await sendDeduped({ dedupeKey: `deadline:${task._id}`, type: 'deadline', title: 'StudyMed — còn hai giờ', body: 'Một nhiệm vụ sắp đến hạn. Mở app để xem chi tiết.', url: `/student/tasks/${task._id}` }));
  }
  if (settings.streakEnabled && local.day === 0 && local.time === '18:00') {
    const goal = await WeeklyGoal.findOne({ weekStart: startOfHcmWeek(now) });
    if (goal && !goal.recovery && goal.earnedXp < goal.targetXp) results.push(await sendDeduped({ dedupeKey: `streak:${local.date}`, type: 'streak', title: 'StudyMed — giữ weekly streak', body: `Bạn còn thiếu ${goal.targetXp - goal.earnedXp} XP trước khi tuần kết thúc.`, url: '/student/today' }));
  }
  return { results };
};

module.exports = { configureWebPush, localParts, isQuietTime, sendDeduped, runNotificationSweep };
