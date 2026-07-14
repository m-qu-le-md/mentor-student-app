import { useAsync } from '../../app/useAsync';
import { ErrorState, Progress, Skeleton } from '../../components/ui';
import { gamificationApi, taskApi } from '../../services/api';
import { TaskCard } from '../tasks/TaskCard';
import '../tasks/tasks.css';

export function ProgressPage() {
  const state = useAsync(async () => { const [tasks, dashboard] = await Promise.all([taskApi.list(), gamificationApi.dashboard()]); return { tasks, dashboard }; });
  if (state.loading) return <main className="page"><Skeleton height={180} /></main>;
  if (state.error) return <main className="page"><ErrorState message={state.error} onRetry={state.reload} /></main>;
  const complete = state.data.tasks.filter((task) => task.status === 'completed');
  const pending = state.data.tasks.filter((task) => task.status === 'pending');
  const failed = state.data.tasks.filter((task) => task.status === 'failed');
  const week = state.data.dashboard.week || {};
  return <main className="page"><header className="page-head"><div><p className="page-kicker">Mentor workspace</p><h1 className="page-title">Tiến độ</h1><p className="page-subtitle">Một màn hình riêng để đọc kết quả, không trộn với Planning hay form giao việc.</p></div></header><section className="grid-3"><article className="mini-metric surface"><span>Đã hoàn thành</span><strong>{complete.length}</strong><small>nhiệm vụ</small></article><article className="mini-metric surface"><span>Đang chờ</span><strong>{pending.length}</strong><small>nhiệm vụ</small></article><article className="mini-metric surface"><span>Thất bại</span><strong>{failed.length}</strong><small>nhiệm vụ</small></article></section><article className="surface" style={{ padding: 24, marginTop: 20 }}><div className="metric-line"><h2 style={{ fontFamily: 'var(--font-display)' }}>Mục tiêu tuần</h2><strong>{week.earnedXp || 0}/{week.targetXp || 200} XP</strong></div><Progress value={week.earnedXp || 0} max={week.targetXp || 200} label="Mục tiêu tuần" /></article><section style={{ marginTop: 32 }}><div className="section-title"><div><span className="eyebrow">Gần đây</span><h2>Hoạt động nhiệm vụ</h2></div></div><div className="stack">{state.data.tasks.slice(0, 10).map((task) => <TaskCard key={task._id} task={task} />)}</div></section></main>;
}
