const mongoose = require('mongoose');

const boardColumnSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Vui lòng nhập tên cột'],
      trim: true,
    },
    position: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BoardColumn', boardColumnSchema);
