// server/routes/evaluationRoutes.js
const express = require('express');
const router = express.Router();
const { getEvaluations, createEvaluation } = require('../controllers/evaluationController');
const { requireMentor } = require('../middlewares/roleCheck');

router.get('/', getEvaluations);
// Cổng kiểm duyệt: Chỉ ai có thẻ 'mentor' mới được gửi bài đánh giá
router.post('/', requireMentor, createEvaluation);

module.exports = router;