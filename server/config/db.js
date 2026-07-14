const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Kết nối tới MongoDB Atlas
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`MongoDB đã kết nối thành công: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Lỗi kết nối MongoDB: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
