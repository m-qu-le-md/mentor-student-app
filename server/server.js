const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const taskRoutes = require('./routes/taskRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const planningRoutes = require('./routes/planningRoutes');
const gamificationRoutes = require('./routes/gamificationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { migrateLegacyTaskFlags, markOverdueTasksFailed, deleteTasksOlderThanOneWeek } = require('./services/taskMaintenance');
const { runNotificationSweep } = require('./services/notificationService');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', project: '001' }));
app.use('/api/tasks', taskRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/planning', planningRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  return res.status(error.status || 500).json({ message: error.message || 'Lỗi server không xác định.' });
});

const startServer = async () => {
  await connectDB();
  await migrateLegacyTaskFlags();
  await Promise.all([markOverdueTasksFailed(), deleteTasksOlderThanOneWeek()]);
  const maintenanceTimer = setInterval(() => Promise.all([markOverdueTasksFailed(), deleteTasksOlderThanOneWeek()]).catch((error) => console.error(`Lỗi bảo trì task: ${error.message}`)), 60 * 1000);
  const notificationTimer = setInterval(() => runNotificationSweep().catch((error) => console.error(`Lỗi notification sweep: ${error.message}`)), 60 * 1000);
  maintenanceTimer.unref(); notificationTimer.unref();
  const port = process.env.PORT || 5000;
  return app.listen(port, () => console.log(`StudyMed Project 001 chạy tại cổng ${port}`));
};

if (require.main === module) {
  startServer().catch((error) => { console.error(`Không thể khởi động server: ${error.message}`); process.exitCode = 1; });
}

module.exports = { app, startServer };
