import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAsync } from '../../app/useAsync';
import { Badge, Button, Dialog, ErrorState, Skeleton } from '../../components/ui';
import { taskApi } from '../../services/api';
import { FLAG_LABEL, SIZE_LABEL, XP_BY_SIZE, formatDate } from './taskUtils';

export function MentorTaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const state = useAsync(() => taskApi.get(taskId), taskId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');
  async function remove() { try { await taskApi.remove(taskId); navigate('/mentor/progress', { replace: true }); } catch (requestError) { setError(requestError.response?.data?.message || requestError.message); } }
  if (state.loading) return <main className="page nested"><Skeleton height={520} /></main>;
  if (state.error) return <main className="page nested"><ErrorState message={state.error} onRetry={state.reload} /></main>;
  const task = state.data;
  return <main className="page nested form-page"><header className="page-head"><div><p className="page-kicker">Chi tiết nhiệm vụ</p><h1 className="page-title">{task.title}</h1></div></header><article className="task-form surface"><div className="cluster"><Badge>{SIZE_LABEL[task.size] || 'Vừa'} · {XP_BY_SIZE[task.size] || 50} XP</Badge>{task.flag && <Badge tone={task.flag === 'red' ? 'coral' : 'amber'}>{FLAG_LABEL[task.flag]}</Badge>}</div><dl className="detail-facts"><div><dt>Deadline</dt><dd>{formatDate(task.dueDate)}</dd></div><div><dt>Trạng thái</dt><dd>{task.status}</dd></div><div><dt>XP đã nhận</dt><dd>{task.xpAwarded || 0}</dd></div></dl>{task.notes && <div className="detail-section"><h3>Ghi chú</h3><p>{task.notes}</p></div>}<div className="form-actions"><Button variant="danger" onClick={() => setConfirmOpen(true)}>Xóa</Button><Button onClick={() => navigate(`/mentor/tasks/${taskId}/edit`)}>Chỉnh sửa</Button></div></article><Dialog open={confirmOpen} title="Xóa nhiệm vụ này?" onClose={() => setConfirmOpen(false)}><p className="muted">Thao tác không thể hoàn tác. XP đã ghi vào ledger không bị cộng lại nếu request cũ được gửi lần nữa.</p>{error && <p className="form-error">{error}</p>}<div className="dialog-actions"><Button variant="secondary" onClick={() => setConfirmOpen(false)}>Hủy</Button><Button variant="danger" onClick={remove}>Xóa nhiệm vụ</Button></div></Dialog></main>;
}
