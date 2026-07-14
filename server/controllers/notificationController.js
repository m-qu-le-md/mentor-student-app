const PushSubscription = require('../models/PushSubscription');
const { getProfile } = require('../services/gamificationService');

const getSettings = async (req, res) => { try { const profile = await getProfile(); res.json(profile.notificationSettings); } catch (error) { res.status(500).json({ message: error.message }); } };
const updateSettings = async (req, res) => {
  try {
    const allowed = ['dailyEnabled', 'deadlineEnabled', 'streakEnabled', 'dailyTime', 'quietStart', 'quietEnd'];
    const updates = Object.fromEntries(allowed.filter((key) => req.body[key] !== undefined).map((key) => [`notificationSettings.${key}`, req.body[key]]));
    for (const key of ['dailyTime', 'quietStart', 'quietEnd']) {
      if (req.body[key] !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(req.body[key])) return res.status(400).json({ message: `${key} phải có định dạng HH:mm.` });
    }
    const profile = await getProfile();
    Object.entries(updates).forEach(([path, value]) => profile.set(path, value));
    await profile.save(); res.json(profile.notificationSettings);
  } catch (error) { res.status(400).json({ message: error.message }); }
};
const subscribe = async (req, res) => {
  try {
    if (!req.body.endpoint || !req.body.keys?.p256dh || !req.body.keys?.auth) return res.status(400).json({ message: 'Push subscription không hợp lệ.' });
    const subscription = await PushSubscription.findOneAndUpdate({ endpoint: req.body.endpoint }, { endpoint: req.body.endpoint, keys: req.body.keys, userAgent: req.headers['user-agent'] || '', active: true }, { upsert: true, returnDocument: 'after', runValidators: true });
    return res.status(201).json({ id: subscription._id, active: subscription.active });
  } catch (error) { return res.status(400).json({ message: error.message }); }
};
const unsubscribe = async (req, res) => { try { await PushSubscription.updateOne({ endpoint: req.body.endpoint }, { $set: { active: false } }); res.json({ message: 'Đã tắt subscription.' }); } catch (error) { res.status(400).json({ message: error.message }); } };
const publicKey = (req, res) => res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });

module.exports = { getSettings, updateSettings, subscribe, unsubscribe, publicKey };
