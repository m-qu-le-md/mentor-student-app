import { useNavigate } from 'react-router-dom';
import { useAsync } from '../../app/useAsync';
import { Button, EmptyState, ErrorState, Progress, Skeleton } from '../../components/ui';
import { gamificationApi, taskApi } from '../../services/api';
import { TaskCard } from './TaskCard';
import { SIZE_LABEL, XP_BY_SIZE, relativeDeadline } from './taskUtils';
import './tasks.css';

export function StudentToday() {
  const navigate = useNavigate();
  const state = useAsync(async () => {
    const [recommendation, dashboard, tasks] = await Promise.all([taskApi.recommended(), gamificationApi.dashboard(), taskApi.list()]);
    return { recommendation, dashboard, tasks };
  });

  if (state.loading) return <main className="page"><Skeleton height={160} /><div style={{ height: 18 }} /><Skeleton height={360} /></main>;
  if (state.error) return <main className="page"><ErrorState message={state.error} onRetry={state.reload} /></main>;
  const task = state.data.recommendation?.task;
  const dashboard = state.data.dashboard;
  const upcoming = state.data.tasks.filter((item) => item.status === 'pending' && item._id !== task?._id).slice(0, 3);

  return <main className="page today-page">
    <header className="page-head"><div><p className="page-kicker">Thứ tự đã được tính cho bạn</p><h1 className="page-title">Bắt đầu từ điều<br />quan trọng nhất.</h1><p className="page-subtitle">Một nhiệm vụ trọng tâm, một bước tiến rõ ràng. Bạn không cần tự sắp xếp lại mọi thứ.</p></div></header>
    {!task ? <EmptyState title="Hôm nay đang nhẹ nhàng" description="Chưa có nhiệm vụ nào được giao. Hãy nghỉ một nhịp hoặc xem lại hành trình của bạn." action={<Button onClick={() => navigate('/student/journey')}>Xem hành trình</Button>} /> : <section className="focus-task surface">
      <div className="focus-copy"><span className="eyebrow">Nhiệm vụ trọng tâm</span><h2>{task.title}</h2><p className="recommend-reason">{state.data.recommendation.reason}</p><div className="focus-meta"><span>{SIZE_LABEL[task.size] || 'Vừa'} · {XP_BY_SIZE[task.size] || 50} XP</span><span>{relativeDeadline(task.dueDate)}</span></div><Button onClick={() => navigate(`/student/tasks/${task._id}`)}>Mở nhiệm vụ</Button></div>
      <div className="focus-symbol" aria-hidden="true"><div className="pulse-ring"><span>+{XP_BY_SIZE[task.size] || 50}</span><small>XP</small></div><svg viewBox="0 0 240 180"><path d="M120 155S32 105 32 58c0-47 61-54 88-12 27-42 88-35 88 12 0 47-88 97-88 97Z" fill="#32b78b" opacity=".2"/><path d="M42 93h38l15-31 27 61 20-42 13 24h43" fill="none" stroke="#164e3d" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
    </section>}
    <section className="today-support">
      <article className="weekly-card surface"><div className="metric-line"><div><span className="eyebrow">Mục tiêu tuần</span><h3>{dashboard.week?.earnedXp || 0} / {dashboard.week?.targetXp || 200} XP</h3></div><strong>{dashboard.week?.percentage || 0}%</strong></div><Progress value={dashboard.week?.earnedXp || 0} max={dashboard.week?.targetXp || 200} label="Mục tiêu XP tuần" /><p>{dashboard.week?.reason || 'Mục tiêu sẽ thích nghi sau giai đoạn hiệu chuẩn.'}</p></article>
      <article className="upcoming-block"><div className="section-title"><div><span className="eyebrow">Tiếp theo</span><h2>Sắp tới</h2></div><Button variant="ghost" onClick={() => navigate('/student/tasks')}>Xem tất cả</Button></div><div className="stack">{upcoming.length ? upcoming.map((item) => <TaskCard key={item._id} task={item} compact onClick={() => navigate(`/student/tasks/${item._id}`)} />) : <p className="muted">Không còn nhiệm vụ đang chờ.</p>}</div></article>
    </section>
  </main>;
}
