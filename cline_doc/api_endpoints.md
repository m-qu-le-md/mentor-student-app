# Các API Endpoints

Mọi request đến các route có prefix `/api` đều được xử lý qua `server.js` sử dụng `express.json()` middleware.

## Task Endpoints (`/api/tasks`)
- `GET /`: Lấy toàn bộ task. Response: `Array<Task>`.
- `PUT /:id/complete`: Params: `id`. Không yêu cầu quyền.
- `POST /`: Body: `{ title, description, dueDate, difficulty }`. Header yêu cầu: `x-role: mentor`.
- `PUT /:id`: Body: `{ ...fields }`. Header yêu cầu: `x-role: mentor`.
- `DELETE /:id`: Header yêu cầu: `x-role: mentor`.

## Evaluation Endpoints (`/api/evaluations`)
- `GET /`: Lấy toàn bộ đánh giá. Response: `Array<Evaluation>`.
- `POST /`: Body: `{ weekStart, weekEnd, mentorRating, mentorFeedback }`. Header yêu cầu: `x-role: mentor`.

*Lưu ý: Header `x-role` là bắt buộc cho các hành động của Mentor. Nếu thiếu hoặc giá trị không phải 'mentor', API sẽ trả về lỗi `403 Forbidden`.*