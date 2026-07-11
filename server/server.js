const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const taskRoutes = require('./routes/taskRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');

// 1. Nạp biến môi trường từ file .env
dotenv.config();

// 2. Kết nối tới MongoDB
connectDB();

// 3. Khởi tạo Express app
const app = express();

// 4. Cài đặt Middleware cơ bản
app.use(cors());
app.use(express.json()); // Để đọc được data dạng JSON từ Frontend gửi lên

// 5. Route chính
app.use('/api/tasks', taskRoutes);
app.use('/api/evaluations', evaluationRoutes);

// 6. Lắng nghe tại cổng đã cài đặt
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại cổng ${PORT}`);
});
