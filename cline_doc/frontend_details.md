# Chi tiết Frontend: Pages, Components & Variables

## 1. Hệ thống điều hướng & Routing
- **`App.jsx`**: Là trung tâm định tuyến. Sử dụng `RoleContext` để quyết định layout nào được hiển thị (Desktop hay Mobile).
- **`main.jsx`**: Thiết lập `RoleProvider`, đảm bảo toàn bộ ứng dụng có quyền truy cập vào `role` và `switchRole`.

## 2. Các thành phần (Components)
- **`TaskForm.jsx`**: Sử dụng `useState` để quản lý `title`, `description`, `dueDate`, `difficulty`. Khi submit, gọi `axiosClient.post('/api/tasks')`.
- **`TaskList.jsx` (Desktop)**: Sử dụng map để liệt kê danh sách. Giao tiếp với `taskController` thông qua `axiosClient`.
- **`MobileTaskList.jsx`**: Phiên bản thu gọn dùng chung logic xử lý dữ liệu với `TaskList.jsx` nhưng thay đổi cách trình bày (thẻ Card).
- **`EvaluationBoard.jsx`**: Form cho Mentor nhập feedback cuối tuần.

## 3. Luồng dữ liệu qua Context & Axios
- **`RoleContext`**: Khi gọi `switchRole`, ứng dụng sẽ re-render toàn bộ components bị ảnh hưởng.
- **`axiosClient`**: 
    - Instance được tạo từ `axios.create()`.
    - `request interceptor`: `config.headers['x-role'] = localStorage.getItem('role') || 'student'`.
    - `response interceptor`: Tự động bắt lỗi 403 để hiển thị thông báo "Bạn không có quyền thực hiện hành động này".

## 4. Các biến trạng thái quan trọng
- `role`: ('mentor' | 'student') - Quyết định UI và API permission.
- `tasks`: Array lưu trữ danh sách công việc.
- `evaluations`: Array lưu trữ các bản đánh giá hàng tuần.