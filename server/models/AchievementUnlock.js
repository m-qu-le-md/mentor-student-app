const mongoose = require('mongoose');

const achievementUnlockSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  unlockedAt: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
}, { timestamps: true });

module.exports = mongoose.model('AchievementUnlock', achievementUnlockSchema);
