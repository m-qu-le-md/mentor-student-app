// server/controllers/evaluationController.js
const Evaluation = require('../models/Evaluation');

// Lấy danh sách đánh giá (Ai cũng xem được)
const getEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.find().sort({ createdAt: -1 }); // Mới nhất lên đầu
    res.status(200).json(evaluations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tạo đánh giá mới (CHỈ MENTOR ĐƯỢC TẠO)
const createEvaluation = async (req, res) => {
  try {
    const { weekStart, weekEnd, mentorRating, mentorFeedback } = req.body;
    
    const newEval = new Evaluation({
      weekStart,
      weekEnd,
      mentorRating: Number(mentorRating),
      mentorFeedback
    });

    await newEval.save();
    res.status(201).json(newEval);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getEvaluations, createEvaluation };