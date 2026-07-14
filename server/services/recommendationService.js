const Task = require('../models/Task');

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const FLAG_ORDER = { red: 0, yellow: 1, none: 2 };

const taskPriority = (task, now = new Date()) => {
  const due = task.dueDate ? new Date(task.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
  const distance = due - now.getTime();
  const bucket = distance < 0 && distance >= -TWO_HOURS_MS ? 0 : distance <= DAY_MS ? 1 : 2;
  return { bucket, flag: FLAG_ORDER[task.flag || 'none'], due, created: new Date(task.createdAt).getTime() };
};

const compareRecommended = (a, b, now = new Date()) => {
  const left = taskPriority(a, now); const right = taskPriority(b, now);
  return left.bucket - right.bucket || left.flag - right.flag || left.due - right.due || left.created - right.created;
};

const reasonFor = (task, now = new Date()) => {
  const priority = taskPriority(task, now);
  if (priority.bucket === 0) return 'Đã quá hạn — còn trong thời gian hoàn tất';
  if (priority.bucket === 1) return 'Sắp hết hạn trong 24 giờ';
  if (task.flag === 'red') return 'Ưu tiên đỏ';
  if (task.flag === 'yellow') return 'Ưu tiên vàng';
  return 'Deadline gần nhất';
};

const getRecommendedTask = async (now = new Date()) => {
  const tasks = await Task.find({ lifecycle: 'assigned', status: 'pending', dueDate: { $gt: new Date(now.getTime() - TWO_HOURS_MS) } }).lean();
  tasks.sort((a, b) => compareRecommended(a, b, now));
  const task = tasks[0] || null;
  return { task, reason: task ? reasonFor(task, now) : 'Không có nhiệm vụ đang chờ' };
};

module.exports = { taskPriority, compareRecommended, reasonFor, getRecommendedTask };
