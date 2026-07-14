import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Field, Input, Select, Textarea } from '../../components/ui';
import { evaluationApi } from '../../services/api';

export function NewReflection() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ weekStart: '', weekEnd: '', mentorRating: '4', mentorFeedback: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  async function submit(event) { event.preventDefault(); setSaving(true); setError(''); try { await evaluationApi.create(form); navigate('/mentor/reflections', { replace: true }); } catch (requestError) { setError(requestError.response?.data?.message || requestError.message); } finally { setSaving(false); } }
  return <main className="page nested form-page"><header className="page-head"><div><p className="page-kicker">Mentor workspace</p><h1 className="page-title">Phản hồi tuần</h1></div></header><form className="task-form surface" onSubmit={submit}><div className="grid-2"><Field label="Bắt đầu tuần" required>{(id) => <Input id={id} type="date" required value={form.weekStart} onChange={set('weekStart')} />}</Field><Field label="Kết thúc tuần" required>{(id) => <Input id={id} type="date" required value={form.weekEnd} onChange={set('weekEnd')} />}</Field></div><Field label="Đánh giá" required>{(id) => <Select id={id} value={form.mentorRating} onChange={set('mentorRating')}><option value="5">5 — Xuất sắc</option><option value="4">4 — Tốt</option><option value="3">3 — Đúng hướng</option><option value="2">2 — Cần điều chỉnh</option><option value="1">1 — Cần hỗ trợ ngay</option></Select>}</Field><Field label="Nội dung phản hồi" hint="Nêu một điểm tốt, một điều nên đổi và bước tiếp theo cụ thể." required>{(id) => <Textarea id={id} required value={form.mentorFeedback} onChange={set('mentorFeedback')} minLength="20" />}</Field>{error && <p className="form-error">{error}</p>}<div className="form-actions"><Button type="button" variant="secondary" onClick={() => navigate(-1)}>Hủy</Button><Button type="submit" disabled={saving}>{saving ? 'Đang gửi…' : 'Gửi phản hồi'}</Button></div></form></main>;
}
