import { Badge } from '../../components/ui';
import { FLAG_LABEL, SIZE_LABEL, XP_BY_SIZE, formatDate, relativeDeadline } from './taskUtils';

export function TaskCard({ task, selected, onClick, compact = false }) {
  return (
    <button className={`task-card ${selected ? 'selected' : ''}`} onClick={onClick} aria-current={selected ? 'true' : undefined}>
      <span className={`flag-line flag-${task.flag || 'none'}`} />
      <span className="task-card-main">
        <span className="task-card-top"><strong>{task.title}</strong><Badge>{XP_BY_SIZE[task.size] || task.xpAwarded || 50} XP</Badge></span>
        {!compact && <span className="task-card-meta"><span>{SIZE_LABEL[task.size] || 'Vừa'}</span><span>{formatDate(task.dueDate)}</span>{task.flag && <span>{FLAG_LABEL[task.flag]}</span>}</span>}
        <span className={`deadline ${new Date(task.dueDate) < new Date() ? 'late' : ''}`}>{task.status === 'pending' ? relativeDeadline(task.dueDate) : task.status === 'completed' ? 'Đã hoàn thành' : 'Không hoàn thành'}</span>
      </span>
    </button>
  );
}
