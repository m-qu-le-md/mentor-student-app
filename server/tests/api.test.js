const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../server');
const XpLedger = require('../models/XpLedger');
const GamificationProfile = require('../models/GamificationProfile');
const WeeklyGoal = require('../models/WeeklyGoal');
const Task = require('../models/Task');
const PushSubscription = require('../models/PushSubscription');
const NotificationEvent = require('../models/NotificationEvent');
const webPush = require('web-push');
const { calculateAdaptiveGoal, startOfHcmWeek } = require('../services/gamificationService');
const { sendDeduped } = require('../services/notificationService');

let mongo;
test.before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()));
});
test.after(async () => { await mongoose.disconnect(); await mongo.stop(); });
test.beforeEach(async () => Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({}))));

test('role matrix chặn Student tạo task và Mentor tạo được payload mở rộng', async () => {
  const payload = { title: 'Ôn sinh lý tim', size: 'medium', dueDate: new Date(Date.now() + 86400000), notes: 'Đọc chương 2', resourceLinks: [{ label: 'Tài liệu', url: 'https://example.com/doc' }] };
  await request(app).post('/api/tasks').set('x-role', 'student').send(payload).expect(403);
  const created = await request(app).post('/api/tasks').set('x-role', 'mentor').send(payload).expect(201);
  assert.equal(created.body.size, 'medium'); assert.equal(created.body.resourceLinks.length, 1);
  await request(app).post('/api/tasks').set('x-role', 'mentor').send({ ...payload, size: 'giant' }).expect(400);
});

test('complete lặp lại chỉ tạo một XP ledger', async () => {
  const created = await request(app).post('/api/tasks').set('x-role', 'mentor').send({ title: 'Quiz ECG', size: 'small', dueDate: new Date(Date.now() + 3600000) }).expect(201);
  const first = await request(app).put(`/api/tasks/${created.body._id}/complete`).set('x-role', 'student').expect(200);
  const second = await request(app).put(`/api/tasks/${created.body._id}/complete`).set('x-role', 'student').expect(200);
  assert.equal(first.body.reward.xpAwarded, 20); assert.equal(second.body.reward.repeated, true);
  assert.equal(await XpLedger.countDocuments({ sourceId: created.body._id }), 1);
  assert.equal((await GamificationProfile.findOne({ key: 'default' })).totalXp, 20);
});

test('task hoàn thành trễ trong grace window nhận nửa XP', async () => {
  const created = await request(app).post('/api/tasks').set('x-role', 'mentor').send({ title: 'Tóm tắt ca', size: 'large', dueDate: new Date(Date.now() - 30 * 60000) }).expect(201);
  const result = await request(app).put(`/api/tasks/${created.body._id}/complete`).set('x-role', 'student').expect(200);
  assert.equal(result.body.reward.xpAwarded, 50); assert.equal(result.body.reward.isLate, true);
});

test('recommended và dashboard có contract ổn định', async () => {
  await request(app).post('/api/tasks').set('x-role', 'mentor').send({ title: 'Ưu tiên đỏ', flag: 'red', dueDate: new Date(Date.now() + 3 * 86400000) });
  await request(app).post('/api/tasks').set('x-role', 'mentor').send({ title: 'Sắp hạn', dueDate: new Date(Date.now() + 2 * 3600000) });
  const recommended = await request(app).get('/api/tasks/recommended').set('x-role', 'student').expect(200);
  assert.equal(recommended.body.task.title, 'Sắp hạn');
  const dashboard = await request(app).get('/api/gamification/dashboard').set('x-role', 'student').expect(200);
  assert.equal(dashboard.body.week.tier, 'calibration'); assert.equal(dashboard.body.week.targetXp, 200);
});

test('adaptive baseline dùng task XP, loại bonus và loại recovery week', async () => {
  const currentStart = startOfHcmWeek(new Date());
  const priorStarts = [new Date(currentStart.getTime() - 14 * 86400000), new Date(currentStart.getTime() - 7 * 86400000)];
  await WeeklyGoal.insertMany(priorStarts.map((weekStart) => ({ weekStart, weekEnd: new Date(weekStart.getTime() + 7 * 86400000 - 1), targetXp: 300, earnedXp: 350, taskXp: 350, tier: 'stable', status: 'settled' })));
  const taskEntries = [];
  for (let offset = 14; offset >= 1; offset -= 1) taskEntries.push({ sourceType: 'task_completion', sourceId: new mongoose.Types.ObjectId(), xp: 50, earnedAt: new Date(currentStart.getTime() - offset * 86400000 + 12 * 3600000), onTime: true, countsTowardBaseline: true });
  taskEntries.push({ sourceType: 'weekly_bonus', sourceId: new mongoose.Types.ObjectId(), xp: 1000, earnedAt: new Date(currentStart.getTime() - 2 * 86400000), countsTowardBaseline: false });
  await XpLedger.insertMany(taskEntries);
  const snapshot = await calculateAdaptiveGoal();
  assert.equal(snapshot.calibrated, true); assert.equal(snapshot.baselineXp, 350); assert.equal(snapshot.targetXp, 340);
  await Task.create({ title: 'Planned XP không đủ', lifecycle: 'planned', size: 'small' });
  const afterPlanning = await calculateAdaptiveGoal();
  assert.equal(afterPlanning.targetXp, snapshot.targetXp);
  await WeeklyGoal.updateOne({ weekStart: priorStarts[0] }, { $set: { recovery: true } });
  const withoutRecovery = await calculateAdaptiveGoal();
  assert.equal(withoutRecovery.calibrated, false); assert.equal(withoutRecovery.opportunityDays, 7);
});

test('notification event gửi một lần và dedupe request lặp', async (context) => {
  const keys = webPush.generateVAPIDKeys();
  process.env.VAPID_PUBLIC_KEY = keys.publicKey; process.env.VAPID_PRIVATE_KEY = keys.privateKey; process.env.VAPID_SUBJECT = 'mailto:test@example.com';
  context.mock.method(webPush, 'sendNotification', async () => ({ statusCode: 201 }));
  await PushSubscription.create({ endpoint: 'https://push.example.test/one', keys: { p256dh: 'public-client-key', auth: 'auth-key' } });
  const payload = { dedupeKey: 'deadline:test-task', type: 'deadline', title: 'StudyMed', body: 'Còn hai giờ', url: '/student/today' };
  const first = await sendDeduped(payload); const second = await sendDeduped(payload);
  assert.equal(first.sent, 1); assert.equal(second.duplicate, true); assert.equal(await NotificationEvent.countDocuments(), 1);
});

test('planning reorder persist và xóa cột chuyển thẻ an toàn', async () => {
  const mentor = { 'x-role': 'mentor' };
  const first = await request(app).post('/api/planning/columns').set(mentor).send({ title: 'Ý tưởng' }).expect(201);
  const second = await request(app).post('/api/planning/columns').set(mentor).send({ title: 'Sẵn sàng' }).expect(201);
  const card = await request(app).post('/api/planning/cards').set(mentor).send({ title: 'Card giữ lại', columnId: first.body._id }).expect(201);
  await request(app).put('/api/planning/columns/reorder').set(mentor).send({ orderedIds: [second.body._id, first.body._id] }).expect(200);
  let board = await request(app).get('/api/planning').set(mentor).expect(200);
  assert.deepEqual(board.body.map((column) => column.title), ['Sẵn sàng', 'Ý tưởng']);
  await request(app).delete(`/api/planning/columns/${first.body._id}`).set(mentor).send({ targetColumnId: second.body._id }).expect(200);
  board = await request(app).get('/api/planning').set(mentor).expect(200);
  assert.equal(board.body.length, 1); assert.equal(board.body[0].cards[0]._id, card.body._id);
});
