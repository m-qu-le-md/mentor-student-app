const mongoose = require('mongoose');

const weeklyGoalSchema = new mongoose.Schema({
  weekStart: { type: Date, required: true, unique: true, index: true },
  weekEnd: { type: Date, required: true },
  targetXp: { type: Number, required: true, min: 10 },
  earnedXp: { type: Number, min: 0, default: 0 },
  taskXp: { type: Number, min: 0, default: 0 },
  tier: { type: String, enum: ['calibration', 'stable', 'balanced', 'breakthrough'], default: 'calibration' },
  recommendedTier: { type: String, enum: ['stable', 'balanced', 'breakthrough'], default: 'stable' },
  recovery: { type: Boolean, default: false },
  locked: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'settled'], default: 'active' },
  weeklyBonus: { type: Number, min: 0, default: 0 },
  algorithmVersion: { type: String, default: 'project-001-v1' },
  explanation: { type: String, default: '' },
  algorithmSnapshot: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
}, { timestamps: true });

module.exports = mongoose.model('WeeklyGoal', weeklyGoalSchema);
