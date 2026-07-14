const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../server');
const Task = require('../models/Task');
const BoardColumn = require('../models/BoardColumn');
const Evaluation = require('../models/Evaluation');

let mongo;
let httpServer;

const addDays = (days, hour = 20) => { const date = new Date(); date.setDate(date.getDate() + days); date.setHours(hour, 0, 0, 0); return date; };

async function start() {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()));
  const columns = await BoardColumn.insertMany([{ title: 'Ý tưởng', position: 0 }, { title: 'Sẵn sàng', position: 1 }, { title: 'Tuần này', position: 2 }]);
  await Task.insertMany([
    { title: 'Ôn sinh lý tim mạch', size: 'medium', dueDate: addDays(0, 23), flag: 'yellow', notes: 'Đọc tài liệu và tóm tắt chu kỳ tim trong 300–500 từ.', resourceLinks: [{ label: 'Sinh lý tim mạch cơ bản', url: 'https://example.com/tim-mach' }], lifecycle: 'assigned' },
    { title: 'Làm 20 câu ECG cơ bản', size: 'small', dueDate: addDays(1), flag: 'red', lifecycle: 'assigned' },
    { title: 'Tóm tắt cơ chế sốc phản vệ', size: 'large', dueDate: addDays(3), lifecycle: 'assigned' },
    { title: 'Lập sơ đồ chẩn đoán đau ngực', lifecycle: 'planned', boardColumnId: columns[0]._id, boardPosition: 0 },
    { title: 'Tổng hợp flashcard giải phẫu tim', lifecycle: 'planned', boardColumnId: columns[1]._id, boardPosition: 0 },
  ]);
  await Evaluation.create({ weekStart: addDays(-7), weekEnd: addDays(-1), mentorRating: 4, mentorFeedback: 'Bạn giữ nhịp học tốt. Tuần tới hãy dành một phiên ngắn để củng cố ECG trước khi tăng khối lượng.' });
  httpServer = app.listen(5000, '127.0.0.1', () => console.log('E2E API ready on 5000'));
}

async function stop() {
  if (httpServer) await new Promise((resolve) => httpServer.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
  process.exit(0);
}
process.on('SIGINT', stop); process.on('SIGTERM', stop);
start().catch((error) => { console.error(error); process.exit(1); });
