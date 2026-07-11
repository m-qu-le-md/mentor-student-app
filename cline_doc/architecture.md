# Kiến trúc & Công nghệ (Tech Stack)

Dự án được xây dựng dựa trên hệ sinh thái MERN Stack:

## 1. Backend chi tiết
- **Entry point:** `server/server.js` (cấu hình express, cors, routes).
- **Database:** `server/config/db.js` - Sử dụng `mongoose.connect()` với `process.env.MONGO_URI`.
- **Middleware:** 
    - `server/middlewares/roleCheck.js`: Hàm `requireMentor` kiểm tra `req.headers['x-role']`. Nếu giá trị khác 'mentor' sẽ trả về mã lỗi 403.
- **Controllers:**
    - `taskController.js`: Xử lý CRUD (create, read, update, delete, complete).
    - `evaluationController.js`: Xử lý việc ghi nhận đánh giá tuần.
- **Routes:** 
    - `taskRoutes.js`: Quản lý các endpoint liên quan đến nhiệm vụ.
    - `evaluationRoutes.js`: Quản lý các endpoint liên quan đến đánh giá.

## 2. Frontend chi tiết
- **Entry point:** `client/src/main.jsx`.
- **Routing:** `client/src/App.jsx` định nghĩa `BrowserRouter`. Sử dụng `RoleContext` để bảo vệ các component.
- **Provider:** `client/src/context/RoleContext.jsx` - Lưu trạng thái `role` vào `localStorage` để duy trì phiên làm việc.
- **API Interceptor:** `client/src/api/axiosClient.js` - Đính kèm `x-role` header vào tất cả các request.

## 3. Database Schema (Mongoose)
- **Task Model:** `server/models/Task.js`
- **Evaluation Model:** `server/models/Evaluation.js`