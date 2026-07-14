const mongoose = require('mongoose');

const xpLedgerSchema = new mongoose.Schema({
  sourceType: { type: String, enum: ['task_completion', 'weekly_bonus', 'achievement_bonus'], required: true },
  sourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  xp: { type: Number, required: true, min: 0 },
  earnedAt: { type: Date, required: true, default: Date.now, index: true },
  taskDueDate: { type: Date, default: null },
  onTime: { type: Boolean, default: null },
  countsTowardBaseline: { type: Boolean, default: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
}, { timestamps: true });

xpLedgerSchema.index({ sourceType: 1, sourceId: 1 }, { unique: true });
module.exports = mongoose.model('XpLedger', xpLedgerSchema);
