// middlewares/roleCheck.js

// Middleware kiểm tra xem role có được phép thực hiện hành động không
const requireMentor = (req, res, next) => {
  // Frontend sẽ phải gửi lên một header tên là 'x-role' (giá trị: 'mentor' hoặc 'student')
  const currentRole = req.headers['x-role'];

  if (!currentRole) {
    return res.status(400).json({ message: 'Lỗi hệ thống: Không xác định được Role hiện tại.' });
  }

  // Nếu là Mentor, cho phép đi tiếp vào controller để thực thi
  if (currentRole === 'mentor') {
    next();
  } else {
    // Nếu là Student, chặn lại ngay lập tức
    return res.status(403).json({ 
      message: 'Từ chối quyền truy cập! Chế độ Sinh Viên chỉ được phép hoàn thành Task, không được tạo/sửa/xóa.' 
    });
  }
};

module.exports = { requireMentor };