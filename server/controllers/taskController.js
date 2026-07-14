const Task = require('../models/Task');
const { awardTaskCompletion } = require('../services/gamificationService');
const { getRecommendedTask } = require('../services/recommendationService');

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const editableFields = ['title', 'dueDate', 'flag', 'size', 'notes', 'resourceLinks'];

const cleanPayload = (body) => Object.fromEntries(editableFields.filter((key) => body[key] !== undefined).map((key) => [key, body[key]]));

const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ lifecycle: 'assigned' }).sort({ dueDate: 1, createdAt: 1 });
    res.status(200).json(tasks);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, lifecycle: 'assigned' });
    if (!task) return res.status(404).json({ message: 'Không tìm thấy Task' });
    return res.json(task);
  } catch (error) { return res.status(400).json({ message: error.message }); }
};

const getRecommended = async (req, res) => {
  try { res.json(await getRecommendedTask()); }
  catch (error) { res.status(500).json({ message: error.message }); }
};

const createTask = async (req, res) => {
  try {
    const task = await Task.create({ ...cleanPayload(req.body), lifecycle: 'assigned', status: 'pending' });
    res.status(201).json(task);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, lifecycle: 'assigned' });
    if (!task) return res.status(404).json({ message: 'Không tìm thấy Task' });
    return res.json({ message: 'Đã xóa Task thành công' });
  } catch (error) { return res.status(500).json({ message: error.message }); }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, lifecycle: 'assigned' }, cleanPayload(req.body),
      { returnDocument: 'after', runValidators: true }
    );
    if (!task) return res.status(404).json({ message: 'Không tìm thấy Task' });
    return res.json(task);
  } catch (error) { return res.status(400).json({ message: error.message }); }
};

const completeTask = async (req, res) => {
  try {
    const now = new Date();
    let task = await Task.findOne({ _id: req.params.id, lifecycle: 'assigned' });
    if (!task) return res.status(404).json({ message: 'Không tìm thấy Task' });
    if (task.status === 'failed') return res.status(409).json({ message: 'Task đã thất bại vì quá hạn nên không thể hoàn thành.' });
    if (task.status === 'pending' && task.dueDate && now.getTime() > task.dueDate.getTime() + TWO_HOURS_MS) {
      task.status = 'failed'; await task.save();
      return res.status(409).json({ message: 'Task đã quá thời gian hoàn tất trễ hai giờ.' });
    }

    if (task.status === 'pending') {
      task = await Task.findOneAndUpdate(
        { _id: task._id, status: 'pending' },
        { $set: { status: 'completed', completedAt: now } },
        { returnDocument: 'after', runValidators: true }
      ) || await Task.findById(task._id);
    }
    const reward = await awardTaskCompletion(task, task.completedAt || now);
    if (task.xpAwarded !== reward.xpAwarded || !task.completedAt) {
      task.xpAwarded = reward.xpAwarded; task.completedAt = task.completedAt || now; await task.save();
    }
    const next = await getRecommendedTask(now);
    return res.json({ task, reward: { ...reward, repeated: !reward.created, nextTask: next.task, nextReason: next.reason } });
  } catch (error) { return res.status(500).json({ message: error.message }); }
};

module.exports = { getTasks, getTask, getRecommended, createTask, deleteTask, updateTask, completeTask };
