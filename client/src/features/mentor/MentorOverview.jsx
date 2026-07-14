import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '../../app/useAsync';
import { Button, ErrorState, Progress, Skeleton } from '../../components/ui';
import { gamificationApi, planningApi, taskApi } from '../../services/api';
import { TaskCard } from '../tasks/TaskCard';
import '../tasks/tasks.css';
import './mentor.css';

export function MentorOverview() {
  const navigate = useNavigate();
  const state = useAsync(async () => {
    const [tasks, dashboard, board, algorithm] = await Promise.all([taskApi.list(), gamificationApi.dashboard(), planningApi.board(), gamificationApi.algorithm()]);
    return { tasks, dashboard, board, algorithm };
  });
  const [goalMessage, setGoalMessage] = useState('');
  if (state.loading) return <main className="page"><Skeleton height={190} /><div style={{ height: 16 }} /><Skeleton height={360} /></main>;
  if (state.error) return <main className="page"><ErrorState message={state.error} onRetry={state.reload} /></main>;
  const { tasks, dashboard, board, algorithm } = state.data;
  const pending = tasks.filter((task) => task.status === 'pending');
  const plannedXp = pending.reduce((sum, task) => sum + ({ small: 20, medium: 50, large: 100 }[task.size] || 50), 0);
  const targetXp = dashboard.week?.targetXp || 200;
  const shortfall = Math.max(0, targetXp - plannedXp);
  const plannedCards = board.reduce((sum, column) => sum + column.cards.length, 0);

  async function chooseGoal(payload) { setGoalMessage(''); try { await gamificationApi.updateWeek(payload); setGoalMessage('Mục tiêu tuần đã khóa theo lựa chọn này.'); await state.reload(); } catch (error) { setGoalMessage(error.response?.data?.message || error.message); } }

  return <main className="page mentor-overview"><header className="page-head"><div><p className="page-kicker">Mentor workspace</p><h1 className="page-title">Một tuần đủ rõ<br />để dẫn đường.</h1><p className="page-subtitle">Nhìn vào phần thiếu hụt, giao đúng việc và để Student tập trung vào thực hiện.</p></div><Button className="page-action" icon="plus" onClick={() => navigate('/mentor/tasks/new')}>Giao nhiệm vụ</Button></header>
    <section className="mentor-metrics">
      <article className="shortfall-card surface"><span className="eyebrow">Kế hoạch tuần</span><div className="shortfall-number"><strong>{plannedXp}</strong><span>/ {targetXp} XP đã lên lịch</span></div><Progress value={plannedXp} max={targetXp} label="XP đã lên lịch" /><p className={shortfall ? 'shortfall-warning' : 'shortfall-good'}>{shortfall ? `Còn thiếu ${shortfall} XP để kế hoạch đủ cho mục tiêu.` : 'Kế hoạch đã đủ để chạm mục tiêu tuần.'}</p><Button variant={shortfall ? 'primary' : 'secondary'} onClick={() => navigate('/mentor/planning')}>{shortfall ? 'Bổ sung kế hoạch' : 'Xem kế hoạch'}</Button></article>
      <div className="metric-stack"><article className="mini-metric surface"><span>Đang chờ</span><strong>{pending.length}</strong><small>nhiệm vụ đã giao</small></article><article className="mini-metric surface"><span>Trong board</span><strong>{plannedCards}</strong><small>ý tưởng chưa giao</small></article><article className="mini-metric surface"><span>Streak hiện tại</span><strong>{dashboard.profile?.currentWeeklyStreak || 0}</strong><small>tuần liên tiếp</small></article></div>
    </section>
    <section className="goal-steward surface"><div><span className="eyebrow">Quyết định trước XP đầu tiên</span><h2>Nhịp mục tiêu tuần</h2><p>{dashboard.week.locked ? 'Mục tiêu đã khóa cho tuần này.' : dashboard.week.tier === 'calibration' ? 'Đang hiệu chuẩn; hệ thống chưa cho chọn tier tùy ý.' : 'Chọn một tier do thuật toán tính sẵn. Không thể nhập một goal thấp tùy ý.'}</p>{goalMessage && <p className="goal-message" role="status">{goalMessage}</p>}</div><div className="tier-actions">{[['stable', 'Ổn định'], ['balanced', 'Cân bằng'], ['breakthrough', 'Bứt phá']].map(([tier, label]) => <Button key={tier} variant={dashboard.week.tier === tier ? 'primary' : 'secondary'} disabled={dashboard.week.locked || dashboard.week.tier === 'calibration'} onClick={() => chooseGoal({ tier })}>{label} · {algorithm.targets?.[tier] || '—'} XP</Button>)}<Button variant="secondary" disabled={dashboard.week.locked || dashboard.week.tier === 'calibration'} onClick={() => chooseGoal({ recovery: true })}>Dùng recovery week</Button></div></section>
    <section className="overview-lower"><div><div className="section-title"><div><span className="eyebrow">Ưu tiên gần nhất</span><h2>Nhiệm vụ đang chạy</h2></div><Button variant="ghost" onClick={() => navigate('/mentor/progress')}>Xem tiến độ</Button></div><div className="stack">{pending.slice(0, 4).map((task) => <TaskCard task={task} key={task._id} onClick={() => navigate(`/mentor/tasks/${task._id}/edit`)} />)}{!pending.length && <p className="muted">Chưa có nhiệm vụ đang chờ.</p>}</div></div><aside className="quick-actions surface"><span className="eyebrow">Thao tác nhanh</span><h2>Tiếp theo nên làm gì?</h2><Button onClick={() => navigate('/mentor/tasks/new')} icon="plus">Giao nhiệm vụ mới</Button><Button variant="secondary" onClick={() => navigate('/mentor/planning')}>Mở planning board</Button><Button variant="secondary" onClick={() => navigate('/mentor/reflections/new')}>Viết phản hồi tuần</Button></aside></section>
  </main>;
}
