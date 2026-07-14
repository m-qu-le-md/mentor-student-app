// routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getTasks, 
  getTask,
  getRecommended,
  createTask, 
  deleteTask, 
  updateTask, 
  completeTask 
} = require('../controllers/taskController');
const { requireMentor } = require('../middlewares/roleCheck');

// Mọi role đều xem được danh sách
router.get('/', getTasks);
router.get('/recommended', getRecommended);
router.get('/:id', getTask);

// Mọi role đều được bấm hoàn thành Task
router.put('/:id/complete', completeTask);

// ==== VÙNG CẤM: CHỈ MENTOR ĐƯỢC VÀO ====
// Bắt buộc request gửi tới các route này phải có header x-role: 'mentor'
router.post('/', requireMentor, createTask);
router.put('/:id', requireMentor, updateTask);
router.delete('/:id', requireMentor, deleteTask);

module.exports = router;
