const XpLedger = require('../models/XpLedger');
const { getDashboard, getAlgorithmExplanation, updateCurrentGoal, hcmDateKey } = require('../services/gamificationService');

const dashboard = async (req, res) => { try { res.json(await getDashboard()); } catch (error) { res.status(500).json({ message: error.message }); } };
const algorithm = async (req, res) => { try { res.json(await getAlgorithmExplanation()); } catch (error) { res.status(500).json({ message: error.message }); } };
const updateWeek = async (req, res) => { try { res.json(await updateCurrentGoal(req.body)); } catch (error) { res.status(error.status || 400).json({ message: error.message }); } };
const activity = async (req, res) => {
  try {
    const start = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
    const entries = await XpLedger.find({ earnedAt: { $gte: start } }).sort({ earnedAt: 1 }).lean();
    const byDay = new Map();
    entries.forEach((entry) => { const key = hcmDateKey(entry.earnedAt); byDay.set(key, (byDay.get(key) || 0) + entry.xp); });
    const days = [];
    for (let offset = 27; offset >= 0; offset -= 1) {
      const date = new Date(Date.now() - offset * 24 * 60 * 60 * 1000);
      const key = hcmDateKey(date); const xp = byDay.get(key) || 0;
      days.push({ date: key, xp, intensity: xp === 0 ? 0 : xp < 50 ? 1 : xp < 100 ? 2 : 3 });
    }
    res.json({ days });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { dashboard, algorithm, updateWeek, activity };
