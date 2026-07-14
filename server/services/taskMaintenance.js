const Task = require('../models/Task');

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const migrateLegacyTaskFlags = async () => {
  await Task.collection.updateMany({ flag: '' }, { $set: { flag: null } });

  await Task.collection.updateMany(
    { difficulty: { $exists: true } },
    { $unset: { difficulty: '' } }
  );

  await Task.collection.updateMany(
    { lifecycle: { $exists: false } },
    { $set: { lifecycle: 'assigned' } }
  );

  await Task.collection.updateMany(
    { size: { $exists: false } },
    { $set: { size: 'medium', notes: '', resourceLinks: [], xpAwarded: 0 } }
  );
};

const markOverdueTasksFailed = async () => {
  const failedBefore = new Date(Date.now() - TWO_HOURS_MS);
  const result = await Task.updateMany(
    { lifecycle: 'assigned', status: 'pending', dueDate: { $lte: failedBefore } },
    { $set: { status: 'failed' } }
  );

  if (result.modifiedCount > 0) {
    console.log(`Đã đánh dấu thất bại ${result.modifiedCount} task quá hạn.`);
  }
};

const deleteTasksOlderThanOneWeek = async () => {
  const deleteBefore = new Date(Date.now() - SEVEN_DAYS_MS);
  const result = await Task.deleteMany({
    lifecycle: 'assigned',
    dueDate: { $lt: deleteBefore },
  });

  if (result.deletedCount > 0) {
    console.log(`Đã xóa ${result.deletedCount} task quá deadline hơn 7 ngày.`);
  }
};

module.exports = { migrateLegacyTaskFlags, markOverdueTasksFailed, deleteTasksOlderThanOneWeek };
