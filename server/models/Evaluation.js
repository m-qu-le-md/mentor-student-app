const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema(
  {
    weekStart: {
      type: Date,
      required: true,
    },
    weekEnd: {
      type: Date,
      required: true,
    },
    mentorRating: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      required: [true, 'Mentor phải chấm điểm hiệu suất tuần này'],
    },
    mentorFeedback: {
      type: String,
      required: [true, 'Mentor phải để lại lời phê bình hoặc động viên'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Evaluation', evaluationSchema);