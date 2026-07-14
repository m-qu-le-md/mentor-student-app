const test = require('node:test');
const assert = require('node:assert/strict');
const { percentile, calculateLevel, startOfHcmWeek, hcmDateKey, capTarget } = require('../services/gamificationService');
const { compareRecommended, reasonFor } = require('../services/recommendationService');
const { isQuietTime, localParts } = require('../services/notificationService');

test('P60, level curve và caps đúng hợp đồng Project 001', () => {
  assert.equal(percentile([20, 40, 60, 80, 100]), 60);
  assert.deepEqual(calculateLevel(0), { current: 1, xpIntoLevel: 0, xpForNext: 200 });
  assert.deepEqual(calculateLevel(200), { current: 2, xpIntoLevel: 0, xpForNext: 250 });
  assert.equal(capTarget(500, 200), 230);
  assert.equal(capTarget(100, 200), 180);
});

test('tuần và ngày dùng timezone Asia/Ho_Chi_Minh', () => {
  const sundayUtc = new Date('2026-07-12T18:30:00.000Z'); // 01:30 thứ Hai tại HCM
  assert.equal(startOfHcmWeek(sundayUtc).toISOString(), '2026-07-12T17:00:00.000Z');
  assert.equal(hcmDateKey(sundayUtc), '2026-07-13');
  assert.deepEqual(localParts(sundayUtc), { date: '2026-07-13', time: '01:30', day: 1 });
});

test('quiet hours qua nửa đêm', () => {
  assert.equal(isQuietTime('22:00'), true);
  assert.equal(isQuietTime('06:59'), true);
  assert.equal(isQuietTime('07:00'), false);
  assert.equal(isQuietTime('18:00'), false);
});

test('recommended ưu tiên bucket rồi flag rồi deadline', () => {
  const now = new Date('2026-07-14T10:00:00.000Z');
  const tasks = [
    { flag: 'red', dueDate: '2026-07-16T10:00:00.000Z', createdAt: '2026-07-01' },
    { flag: null, dueDate: '2026-07-14T18:00:00.000Z', createdAt: '2026-07-02' },
    { flag: 'yellow', dueDate: '2026-07-14T09:00:00.000Z', createdAt: '2026-07-03' },
  ].sort((a, b) => compareRecommended(a, b, now));
  assert.equal(tasks[0].flag, 'yellow');
  assert.match(reasonFor(tasks[0], now), /quá hạn/i);
  assert.equal(tasks[1].flag, null);
});
