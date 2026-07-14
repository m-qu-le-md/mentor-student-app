const BoardColumn = require('../models/BoardColumn');
const Task = require('../models/Task');

const ensureDefaultColumns = async () => {
  const count = await BoardColumn.countDocuments();
  if (count === 0) {
    await BoardColumn.insertMany([
      { title: 'Ý tưởng', position: 0 },
      { title: 'Sẵn sàng', position: 1 },
    ]);
  }
};

const getBoard = async (req, res) => {
  try {
    await ensureDefaultColumns();
    const columns = await BoardColumn.find().sort({ position: 1, createdAt: 1 }).lean();
    const cards = await Task.find({ lifecycle: 'planned' }).sort({ boardPosition: 1, createdAt: 1 }).lean();
    const cardsByColumn = new Map();
    cards.forEach((card) => {
      const key = String(card.boardColumnId);
      cardsByColumn.set(key, [...(cardsByColumn.get(key) || []), card]);
    });
    res.json(columns.map((column) => ({ ...column, cards: cardsByColumn.get(String(column._id)) || [] })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createColumn = async (req, res) => {
  try {
    const title = req.body.title?.trim();
    if (!title) return res.status(400).json({ message: 'Vui lòng nhập tên cột.' });
    const position = await BoardColumn.countDocuments();
    const column = await BoardColumn.create({ title, position });
    res.status(201).json(column);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const updateColumn = async (req, res) => {
  try {
    const title = req.body.title?.trim();
    if (!title) return res.status(400).json({ message: 'Vui lòng nhập tên cột.' });
    const column = await BoardColumn.findByIdAndUpdate(req.params.id, { title }, { returnDocument: 'after', runValidators: true });
    if (!column) return res.status(404).json({ message: 'Không tìm thấy cột.' });
    res.json(column);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const deleteColumn = async (req, res) => {
  try {
    const column = await BoardColumn.findById(req.params.id);
    if (!column) return res.status(404).json({ message: 'Không tìm thấy cột.' });
    const columns = await BoardColumn.find();
    if (columns.length < 2) return res.status(409).json({ message: 'Board phải còn ít nhất một cột.' });
    const targetColumnId = req.body.targetColumnId;
    if (!targetColumnId || String(targetColumnId) === String(column._id)) return res.status(400).json({ message: 'Vui lòng chọn cột đích hợp lệ.' });
    const target = await BoardColumn.findById(targetColumnId);
    if (!target) return res.status(400).json({ message: 'Cột đích không tồn tại.' });
    const lastCard = await Task.findOne({ lifecycle: 'planned', boardColumnId: target._id }).sort({ boardPosition: -1 });
    const cardsToMove = await Task.find({ lifecycle: 'planned', boardColumnId: column._id }).sort({ boardPosition: 1, createdAt: 1 });
    await Promise.all(cardsToMove.map((card, index) => Task.findByIdAndUpdate(card._id, {
      boardColumnId: target._id,
      boardPosition: (lastCard?.boardPosition ?? -1) + index + 1,
    })));
    await column.deleteOne();
    res.json({ message: 'Đã xóa cột.' });
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const reorderColumns = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    const count = await BoardColumn.countDocuments({ _id: { $in: orderedIds || [] } });
    if (!Array.isArray(orderedIds) || count !== orderedIds.length) return res.status(400).json({ message: 'Danh sách cột không hợp lệ.' });
    await Promise.all(orderedIds.map((id, position) => BoardColumn.findByIdAndUpdate(id, { position })));
    res.json({ message: 'Đã sắp xếp cột.' });
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const createCard = async (req, res) => {
  try {
    const title = req.body.title?.trim();
    const column = await BoardColumn.findById(req.body.columnId);
    if (!title) return res.status(400).json({ message: 'Vui lòng nhập tên công việc.' });
    if (!column) return res.status(400).json({ message: 'Cột không tồn tại.' });
    const last = await Task.findOne({ lifecycle: 'planned', boardColumnId: column._id }).sort({ boardPosition: -1 });
    const card = await Task.create({ title, lifecycle: 'planned', boardColumnId: column._id, boardPosition: (last?.boardPosition ?? -1) + 1 });
    res.status(201).json(card);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const updateCard = async (req, res) => {
  try {
    const title = req.body.title?.trim();
    if (!title) return res.status(400).json({ message: 'Vui lòng nhập tên công việc.' });
    const card = await Task.findOneAndUpdate({ _id: req.params.id, lifecycle: 'planned' }, { title }, { returnDocument: 'after', runValidators: true });
    if (!card) return res.status(404).json({ message: 'Không tìm thấy thẻ kế hoạch.' });
    res.json(card);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const deleteCard = async (req, res) => {
  try {
    const card = await Task.findOneAndDelete({ _id: req.params.id, lifecycle: 'planned' });
    if (!card) return res.status(404).json({ message: 'Không tìm thấy thẻ kế hoạch.' });
    res.json({ message: 'Đã xóa thẻ kế hoạch.' });
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const reorderCards = async (req, res) => {
  try {
    const { columnId, orderedIds } = req.body;
    if (!await BoardColumn.exists({ _id: columnId })) return res.status(400).json({ message: 'Cột không tồn tại.' });
    if (!Array.isArray(orderedIds)) return res.status(400).json({ message: 'Danh sách thẻ không hợp lệ.' });
    const cards = await Task.find({ _id: { $in: orderedIds }, lifecycle: 'planned' });
    if (cards.length !== orderedIds.length) return res.status(400).json({ message: 'Danh sách thẻ không hợp lệ.' });
    await Promise.all(orderedIds.map((id, boardPosition) => Task.findByIdAndUpdate(id, { boardColumnId: columnId, boardPosition })));
    res.json({ message: 'Đã sắp xếp thẻ.' });
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const assignCard = async (req, res) => {
  try {
    const { title, dueDate, flag, size, notes, resourceLinks } = req.body;
    if (!dueDate) return res.status(400).json({ message: 'Bắt buộc chọn deadline khi giao việc.' });
    const card = await Task.findOneAndUpdate(
      { _id: req.params.id, lifecycle: 'planned' },
      {
        ...(title?.trim() ? { title: title.trim() } : {}),
        lifecycle: 'assigned', dueDate, flag: flag ?? null, size: size || 'medium',
        notes: notes || '', resourceLinks: resourceLinks || [], status: 'pending',
        boardColumnId: null, boardPosition: 0,
      },
      { returnDocument: 'after', runValidators: true }
    );
    if (!card) return res.status(404).json({ message: 'Không tìm thấy thẻ kế hoạch.' });
    res.json(card);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

module.exports = { getBoard, createColumn, updateColumn, deleteColumn, reorderColumns, createCard, updateCard, deleteCard, reorderCards, assignCard };
