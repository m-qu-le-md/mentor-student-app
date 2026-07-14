import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAsync } from '../../app/useAsync';
import { Badge, Button, EmptyState, ErrorState, IconButton, Skeleton, Tabs } from '../../components/ui';
import { taskApi } from '../../services/api';
import { RewardDialog } from './RewardDialog';
import { TaskCard } from './TaskCard';
import { FLAG_LABEL, SIZE_LABEL, XP_BY_SIZE, formatDate, taskBucket } from './taskUtils';

export function StudentTasks() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('today');
  const [reward, setReward] = useState(null);
  const [completing, setCompleting] = useState(false);
  const state = useAsync(taskApi.list);
  const selected = state.data?.find((item) => item._id === taskId);
  const effectiveFilter = selected ? taskBucket(selected) : filter;
  const filtered = (state.data || []).filter((task) => taskBucket(task) === effectiveFilter);

  async function complete() {
    setCompleting(true);
    try {
      const result = await taskApi.complete(selected._id);
      setReward(result.reward);
      await state.reload();
    } catch (error) {
      window.dispatchEvent(new CustomEvent('studymed-toast', { detail: error.response?.data?.message || error.message }));
    } finally { setCompleting(false); }
  }

  if (state.loading) return <main className="page"><Skeleton height={140} /><div style={{ height: 16 }} /><Skeleton height={440} /></main>;
  if (state.error) return <main className="page"><ErrorState message={state.error} onRetry={state.reload} /></main>;

  return <main className={`page tasks-page ${taskId ? 'has-detail nested' : ''}`}>
    <header className="page-head tasks-head"><div><p className="page-kicker">Không gian thực hiện</p><h1 className="page-title">Nhiệm vụ</h1></div></header>
    <div className="task-workspace">
      <section className={`task-list-panel ${taskId ? 'detail-open' : ''}`}>
        <Tabs label="Lọc nhiệm vụ" value={effectiveFilter} onChange={setFilter} items={[{ value: 'today', label: 'Hôm nay' }, { value: 'upcoming', label: 'Sắp tới' }, { value: 'past', label: 'Đã qua' }]} />
        <div className="task-list">{filtered.length ? filtered.map((task) => <TaskCard key={task._id} task={task} selected={task._id === taskId} onClick={() => navigate(`/student/tasks/${task._id}`)} />) : <EmptyState title="Chưa có nhiệm vụ" description="Nhóm này đang trống." />}</div>
      </section>
      {taskId && <section className="task-detail surface">{selected ? <>
        <div className="detail-toolbar"><IconButton icon="back" label="Đóng chi tiết" onClick={() => navigate('/student/tasks')} /><Badge>{SIZE_LABEL[selected.size] || 'Vừa'} · {XP_BY_SIZE[selected.size] || 50} XP</Badge></div>
        <div className="task-illustration" aria-hidden="true"><span>+</span><svg viewBox="0 0 260 140"><path d="M25 80h48l18-39 34 77 28-58 16 31h66" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
        <p className="eyebrow">Nhiệm vụ học tập</p><h2>{selected.title}</h2>
        <dl className="detail-facts"><div><dt>Deadline</dt><dd>{formatDate(selected.dueDate)}</dd></div><div><dt>Ưu tiên</dt><dd>{FLAG_LABEL[selected.flag] || 'Bình thường'}</dd></div><div><dt>Trạng thái</dt><dd>{selected.status === 'pending' ? 'Đang chờ' : selected.status === 'completed' ? 'Đã hoàn thành' : 'Đã thất bại'}</dd></div></dl>
        {(selected.notes || selected.description) && <div className="detail-section"><h3>Ghi chú từ Mentor</h3><p>{selected.notes || selected.description}</p></div>}
        {selected.resourceLinks?.length > 0 && <div className="detail-section"><h3>Tài liệu</h3>{selected.resourceLinks.map((link) => <a className="resource-link" href={link.url} target="_blank" rel="noreferrer" key={`${link.url}-${link.label}`}>{link.label}</a>)}</div>}
        {selected.status === 'pending' && <Button className="complete-cta" icon="check" disabled={completing || !navigator.onLine} onClick={complete}>{completing ? 'Đang ghi nhận…' : `Hoàn thành · ${XP_BY_SIZE[selected.size] || 50} XP`}</Button>}
      </> : <ErrorState message="Nhiệm vụ không tồn tại hoặc đã được xóa." onRetry={() => navigate('/student/tasks')} />}</section>}
    </div>
    <RewardDialog reward={reward} onClose={() => setReward(null)} onNext={() => { const id = reward?.nextTask?._id; setReward(null); navigate(id ? `/student/tasks/${id}` : '/student/today'); }} />
  </main>;
}
