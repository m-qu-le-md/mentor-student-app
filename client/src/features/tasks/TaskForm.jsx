import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAsync } from '../../app/useAsync';
import { Button, ErrorState, Field, Input, Select, Skeleton, Tabs, Textarea } from '../../components/ui';
import { planningApi, taskApi } from '../../services/api';
import { XP_BY_SIZE } from './taskUtils';

const empty = { title: '', size: 'medium', dueDate: '', flag: '', notes: '', resourceLabel: '', resourceUrl: '' };
const toLocalInput = (value) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';

export function TaskForm() {
  const { taskId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const plannedCardId = new URLSearchParams(location.search).get('plannedCardId');
  const edit = Boolean(taskId && location.pathname.endsWith('/edit'));
  const taskState = useAsync(() => edit ? taskApi.get(taskId) : Promise.resolve(null), `${edit}:${taskId || ''}`);
  const [form, setForm] = useState(() => ({ ...empty, title: location.state?.title || '' }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);

  useEffect(() => {
    if (!taskState.data) return;
    const task = taskState.data;
    // Dữ liệu bất đồng bộ là nguồn khởi tạo duy nhất của form edit.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({ title: task.title, size: task.size || 'medium', dueDate: toLocalInput(task.dueDate), flag: task.flag || '', notes: task.notes || '', resourceLabel: task.resourceLinks?.[0]?.label || '', resourceUrl: task.resourceLinks?.[0]?.url || '' });
  }, [taskState.data]);

  const payload = useMemo(() => ({ title: form.title.trim(), size: form.size, dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : '', flag: form.flag || null, notes: form.notes.trim(), resourceLinks: form.resourceUrl ? [{ label: form.resourceLabel.trim() || form.resourceUrl, url: form.resourceUrl.trim() }] : [] }), [form]);
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setError(''); setSaving(true);
    try {
      if (plannedCardId) await planningApi.assignCard(plannedCardId, payload);
      else if (edit) await taskApi.update(taskId, payload);
      else await taskApi.create(payload);
      navigate('/mentor/planning', { replace: true, state: { toast: edit ? 'Đã cập nhật nhiệm vụ.' : 'Đã giao nhiệm vụ.' } });
    } catch (requestError) { setError(requestError.response?.data?.message || requestError.message); }
    finally { setSaving(false); }
  }

  if (taskState.loading) return <main className="page nested"><Skeleton height={620} /></main>;
  if (taskState.error) return <main className="page nested"><ErrorState message={taskState.error} onRetry={taskState.reload} /></main>;

  return <main className="page nested form-page"><header className="page-head"><div><p className="page-kicker">Mentor workspace</p><h1 className="page-title">{edit ? 'Chỉnh nhiệm vụ' : 'Giao nhiệm vụ'}</h1></div></header>
    <form className="task-form surface" onSubmit={submit}>
      <Field label="Tên nhiệm vụ" required>{(id) => <Input id={id} value={form.title} onChange={set('title')} required maxLength="160" autoFocus />}</Field>
      <Field label="Kích thước" hint="Kích thước quyết định số XP nhận được." required><Tabs label="Kích thước nhiệm vụ" value={form.size} onChange={(size) => setForm((current) => ({ ...current, size }))} items={[{ value: 'small', label: 'Nhỏ · 20 XP' }, { value: 'medium', label: 'Vừa · 50 XP' }, { value: 'large', label: 'Lớn · 100 XP' }]} /></Field>
      <div className="grid-2"><Field label="Hạn hoàn thành" required>{(id) => <Input id={id} type="datetime-local" value={form.dueDate} onChange={set('dueDate')} required />}</Field><Field label="Mức ưu tiên">{(id) => <Select id={id} value={form.flag} onChange={set('flag')}><option value="">Không ưu tiên</option><option value="yellow">Cờ vàng</option><option value="red">Cờ đỏ</option></Select>}</Field></div>
      <Field label="Ghi chú">{(id) => <Textarea id={id} value={form.notes} onChange={set('notes')} maxLength="2000" placeholder="Kết quả mong đợi, cách thực hiện hoặc lời nhắc ngắn…" />}</Field>
      <div className="resource-fields"><Field label="Tên tài liệu">{(id) => <Input id={id} value={form.resourceLabel} onChange={set('resourceLabel')} placeholder="Ví dụ: Tài liệu sinh lý tim mạch" />}</Field><Field label="Liên kết">{(id) => <Input id={id} type="url" value={form.resourceUrl} onChange={set('resourceUrl')} placeholder="https://…" />}</Field></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions"><Button type="button" variant="secondary" onClick={() => navigate(-1)}>Hủy</Button><Button type="submit" disabled={saving || !online}>{saving ? 'Đang lưu…' : `${edit ? 'Lưu thay đổi' : 'Giao nhiệm vụ'} · ${XP_BY_SIZE[form.size]} XP`}</Button></div>
    </form>
  </main>;
}
