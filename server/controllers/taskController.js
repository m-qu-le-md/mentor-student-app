// controllers/taskController.js
const Task = require('../models/Task');

// 1. Lấy danh sách Task (Cả Mentor và Student đều xem được)
// - Mentor xem tất cả để quản lý
// - Student xem để làm việc
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find().sort({ dueDate: 1 }); // Sắp xếp theo deadline gần nhất
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Tạo Task mới (CHỈ DÀNH CHO MENTOR)
const createTask = async (req, res) => {
  try {
    const { title, description, dueDate, difficulty } = req.body;
    const newTask = new Task({ title, description, dueDate, difficulty });
    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 3. Xóa Task (CHỈ DÀNH CHO MENTOR)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Không tìm thấy Task' });
    res.status(200).json({ message: 'Đã xóa Task thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Sửa Task - đổi tên, dời deadline (CHỈ DÀNH CHO MENTOR)
const updateTask = async (req, res) => {
  try {
    // Lấy các trường muốn update từ body
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true } // Trả về data mới và chạy validate Schema
    );
    if (!updatedTask) return res.status(404).json({ message: 'Không tìm thấy Task' });
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 5. Đánh dấu hoàn thành Task (Dành cho CẢ HAI, đặc biệt là STUDENT)
const completeTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Không tìm thấy Task' });

    // Chuyển status từ pending -> completed
    task.status = 'completed';
    await task.save();

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTasks, createTask, deleteTask, updateTask, completeTask };