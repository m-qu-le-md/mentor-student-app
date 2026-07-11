# Cấu trúc dữ liệu (Data Models)

## Task (Nhiệm vụ)
- `title` (String): Tên nhiệm vụ.
- `description` (String): Mô tả chi tiết.
- `dueDate` (Date): Hạn chót.
- `status` (Enum: pending, completed, failed): Trạng thái.
- `difficulty` (Number: 1-5): Độ khó.
- `createdAt/updatedAt`: Tự động tạo bởi mongoose.

## Evaluation (Đánh giá)
- `weekStart` (Date): Ngày bắt đầu tuần.
- `weekEnd` (Date): Ngày kết thúc tuần.
- `mentorRating` (Number: 1-5): Điểm đánh giá.
- `mentorFeedback` (String): Lời nhận xét.
- `createdAt/updatedAt`: Tự động tạo bởi mongoose.