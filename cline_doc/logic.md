# Logic Hoạt động & Phân quyền

Vì đây là ứng dụng phục vụ cá nhân (Personal Use), hệ thống loại bỏ cơ chế đăng nhập (Authentication) truyền thống để tối ưu trải nghiệm. Bảo mật được thiết lập qua Ủy quyền theo Vị trí (Role-based Authorization):

## Tại Frontend
Nút "Switch Role" lưu trạng thái vào Context và LocalStorage. Tùy thuộc vào trạng thái này, UI sẽ hiển thị (Render) các component khác nhau (Theme tối/sáng, hiện/ẩn form).

## Tại Backend
Mọi Request gửi lên đều đính kèm Header `x-role`. Middleware `requireMentor` đóng vai trò gác cổng:
- Nếu `x-role === 'mentor'`: Cho phép đi qua và thao tác với Database.
- Nếu `x-role === 'student'`: Chặn đứng các hành động POST, PUT, DELETE (trừ việc hoàn thành Task) và trả về lỗi 403 Forbidden.