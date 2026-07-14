const mongoose = require('mongoose');

const notificationSettingsSchema = new mongoose.Schema({
  dailyEnabled: { type: Boolean, default: true },
  deadlineEnabled: { type: Boolean, default: true },
  streakEnabled: { type: Boolean, default: true },
  dailyTime: { type: String, default: '07:00' },
  quietStart: { type: String, default: '22:00' },
  quietEnd: { type: String, default: '07:00' },
}, { _id: false });

const gamificationProfileSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'default' },
  totalXp: { type: Number, min: 0, default: 0 },
  currentWeeklyStreak: { type: Number, min: 0, default: 0 },
  longestWeeklyStreak: { type: Number, min: 0, default: 0 },
  timezone: { type: String, default: 'Asia/Ho_Chi_Minh' },
  calibrationStartedAt: { type: Date, default: Date.now },
  notificationSettings: { type: notificationSettingsSchema, default: () => ({}) },
}, { timestamps: true });

module.exports = mongoose.model('GamificationProfile', gamificationProfileSchema);
