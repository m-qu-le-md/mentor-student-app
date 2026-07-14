const mongoose = require('mongoose');
const taskFlags = require('../../shared/taskFlags.json');

const flagCodes = taskFlags.map((flag) => flag.code);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Vui lòng nhập tên nhiệm vụ'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    size: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    resourceLinks: {
      type: [{
        label: { type: String, required: true, trim: true, maxlength: 160 },
        url: { type: String, required: true, trim: true, maxlength: 2000 },
      }],
      default: [],
    },
    dueDate: {
      type: Date,
      required: function requiredDeadline() {
        return this.lifecycle === 'assigned';
      },
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    flag: {
      type: String,
      enum: {
        values: [...flagCodes, null],
        message: 'Cờ ưu tiên không hợp lệ',
      },
      default: null,
    },
    lifecycle: {
      type: String,
      enum: ['planned', 'assigned'],
      default: 'assigned',
      index: true,
    },
    boardColumnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BoardColumn',
      default: null,
      index: true,
    },
    boardPosition: { type: Number, default: 0 },
    completedAt: { type: Date, default: null },
    xpAwarded: { type: Number, min: 0, default: 0 },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

taskSchema.index({ lifecycle: 1, status: 1, dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
