import { useNavigate, useParams } from 'react-router-dom';
import { useRole } from '../../app/RoleContext';
import { useAsync } from '../../app/useAsync';
import { Badge, Button, EmptyState, ErrorState, IconButton, Skeleton } from '../../components/ui';
import { evaluationApi } from '../../services/api';
import { formatDate } from '../tasks/taskUtils';
import './reflections.css';

export function ReflectionsPage() {
  const { evaluationId } = useParams();
  const { role } = useRole();
  const navigate = useNavigate();
  const state = useAsync(evaluationApi.list);
  if (state.loading) return <main className="page"><Skeleton height={500} /></main>;
  if (state.error) return <main className="page"><ErrorState message={state.error} onRetry={state.reload} /></main>;
  const selected = state.data.find((item) => item._id === evaluationId);
  const base = role === 'mentor' ? '/mentor/reflections' : '/student/reflections';
  return <main className={`page reflections-page ${evaluationId ? 'nested' : ''}`}><header className="page-head"><div><p className="page-kicker">Nhìn lại để tiến lên</p><h1 className="page-title">Phản hồi</h1><p className="page-subtitle">Mỗi tuần là một lát cắt: điều đã tốt, điều cần đổi và một hướng đi cụ thể.</p></div>{role === 'mentor' && <Button className="page-action" onClick={() => navigate('/mentor/reflections/new')}>Viết phản hồi</Button>}</header>
    <div className="reflection-layout"><section className={`reflection-list ${evaluationId ? 'detail-open' : ''}`}>{state.data.length ? state.data.map((item) => <button key={item._id} className={`reflection-row ${item._id === evaluationId ? 'selected' : ''}`} onClick={() => navigate(`${base}/${item._id}`)}><span><strong>Tuần {formatDate(item.weekStart, false)}</strong><small>{formatDate(item.weekStart, false)} – {formatDate(item.weekEnd, false)}</small></span><Badge>{item.mentorRating}/5</Badge></button>) : <EmptyState title="Chưa có phản hồi" description={role === 'mentor' ? 'Viết phản hồi đầu tiên khi kết thúc tuần.' : 'Mentor chưa gửi phản hồi tuần nào.'} action={role === 'mentor' && <Button onClick={() => navigate('/mentor/reflections/new')}>Viết phản hồi</Button>} />}</section>{evaluationId && <article className="reflection-detail surface">{selected ? <><div className="detail-toolbar"><IconButton icon="back" label="Đóng phản hồi" onClick={() => navigate(base)} /><Badge>{selected.mentorRating}/5 điểm</Badge></div><span className="eyebrow">Tuần {formatDate(selected.weekStart, false)}</span><h2>Phản hồi từ Mentor</h2><blockquote>{selected.mentorFeedback}</blockquote><p className="muted">Từ {formatDate(selected.weekStart, false)} đến {formatDate(selected.weekEnd, false)}</p></> : <ErrorState message="Không tìm thấy phản hồi này." onRetry={() => navigate(base)} />}</article>}</div>
  </main>;
}
