export const XP_BY_SIZE = { small: 20, medium: 50, large: 100 };
export const SIZE_LABEL = { small: 'Nhỏ', medium: 'Vừa', large: 'Lớn' };
export const FLAG_LABEL = { red: 'Ưu tiên đỏ', yellow: 'Ưu tiên vàng' };

export function formatDate(value, withTime = true) {
  if (!value) return 'Chưa có hạn';
  return new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) }).format(new Date(value));
}

export function relativeDeadline(value) {
  if (!value) return 'Không có deadline';
  const hours = Math.round((new Date(value) - new Date()) / 36e5);
  if (hours < 0) return `Quá hạn ${Math.abs(hours)} giờ`;
  if (hours < 24) return `Còn ${hours} giờ`;
  return `Còn ${Math.ceil(hours / 24)} ngày`;
}

export function taskBucket(task) {
  if (task.status !== 'pending') return 'past';
  const date = new Date(task.dueDate);
  const now = new Date();
  if (date.toDateString() === now.toDateString() || date < now) return 'today';
  return 'upcoming';
}
