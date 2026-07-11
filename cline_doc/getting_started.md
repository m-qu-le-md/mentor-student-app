# Hướng dẫn bắt đầu dự án

## Yêu cầu hệ thống
- Node.js (v18+)
- MongoDB (Local hoặc Cloud Atlas)

## Cấu hình
1. **Server:**
   - Di chuyển vào thư mục `/server`
   - Tạo file `.env` (copy từ .env.example nếu có) với biến `MONGO_URI`, `PORT`, `JWT_SECRET`.
   - Chạy `npm install`
   - Chạy `npm start`
2. **Client:**
   - Di chuyển vào thư mục `/client`
   - Chạy `npm install`
   - Chạy `npm run dev`

## Phát triển
- Cấu hình IDE với ESLint để đảm bảo code quality.