const mongoose = require('mongoose');

const notificationEventSchema = new mongoose.Schema({
  dedupeKey: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  payload: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
}, { timestamps: true });

notificationEventSchema.index({ sentAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
module.exports = mongoose.model('NotificationEvent', notificationEventSchema);
