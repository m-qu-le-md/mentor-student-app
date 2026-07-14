import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAsync } from '../../app/useAsync';
import { Badge, Button, Dialog, EmptyState, ErrorState, Field, IconButton, Input, Skeleton, Tabs } from '../../components/ui';
import { planningApi } from '../../services/api';
import './planning.css';

export function PlanningBoard() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = useAsync(planningApi.board);
  const [activeColumn, setActiveColumn] = useState('');
  const [dialog, setDialog] = useState(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const columns = useMemo(() => state.data || [], [state.data]);
  const activeId = activeColumn || columns[0]?._id;
  const tabs = useMemo(() => columns.map((column) => ({ value: column._id, label: `${column.title} · ${column.cards.length}` })), [columns]);

  function open(type, payload = null) { setDialog({ type, payload }); setTitle(payload?.title || ''); setError(''); }
  function close() { setDialog(null); setTitle(''); setError(''); }
  async function act(action) { setSaving(true); setError(''); try { await action(); close(); await state.reload(); } catch (requestError) { setError(requestError.response?.data?.message || requestError.message); } finally { setSaving(false); } }
  function assign(card) { navigate(`/mentor/tasks/new?plannedCardId=${card._id}`, { state: { title: card.title } }); }
  function move(card, column) {
    const target = columns.find((item) => item._id === column);
    const orderedIds = [...target.cards.map((item) => item._id), card._id];
    act(() => planningApi.moveCard(column, orderedIds));
  }
  function moveColumn(column, delta) {
    const ordered = columns.map((item) => item._id);
    const from = ordered.indexOf(column._id); const to = from + delta;
    if (to < 0 || to >= ordered.length) return;
    [ordered[from], ordered[to]] = [ordered[to], ordered[from]];
    act(() => planningApi.reorderColumns(ordered));
  }

  if (state.loading) return <main className="page"><Skeleton height={150} /><div style={{ height: 16 }} /><Skeleton height={500} /></main>;
  if (state.error) return <main className="page"><ErrorState message={state.error} onRetry={state.reload} /></main>;

  return <main className="page planning-page"><header className="page-head"><div><p className="page-kicker">Từ ý tưởng đến hành động</p><h1 className="page-title">Planning</h1><p className="page-subtitle">Board giữ ý tưởng gọn gàng. Chỉ khi giao việc, card mới trở thành nhiệm vụ có deadline và XP.</p></div><Button className="page-action" icon="plus" onClick={() => open('new-card', { columnId: activeId })}>Thêm công việc</Button></header>
    {location.state?.toast && <div className="inline-success" role="status">{location.state.toast}</div>}
    <div className="mobile-column-tabs"><Tabs label="Cột planning" items={tabs} value={activeId} onChange={setActiveColumn} /></div>
    <section className="planning-board">
      {columns.map((column) => <article key={column._id} className={`planning-column ${column._id === activeId ? 'mobile-active' : ''}`}><header className="column-head"><div><h2>{column.title}</h2><Badge>{column.cards.length}</Badge></div><IconButton icon="more" label={`Tùy chọn cột ${column.title}`} onClick={() => open('column-menu', column)} /></header><div className="planned-cards">{column.cards.map((card) => <article className="planned-card" key={card._id}><span className="planned-mark" /><h3>{card.title}</h3>{card.notes && <p>{card.notes}</p>}<div className="planned-actions"><Button variant="ghost" onClick={() => assign(card)}>Giao việc</Button><IconButton icon="more" label={`Tùy chọn ${card.title}`} onClick={() => open('card-menu', { ...card, columnId: column._id })} /></div></article>)}{!column.cards.length && <EmptyState title="Cột đang trống" description="Thêm một ý tưởng hoặc di chuyển công việc vào đây." />}</div><Button variant="ghost" icon="plus" onClick={() => open('new-card', { columnId: column._id })}>Thêm công việc</Button></article>)}
    </section>
    <Button variant="secondary" icon="plus" onClick={() => open('new-column')}>Thêm cột</Button>

    <Dialog open={dialog?.type === 'new-card' || dialog?.type === 'edit-card' || dialog?.type === 'new-column' || dialog?.type === 'edit-column'} title={dialog?.type?.includes('column') ? (dialog?.type === 'new-column' ? 'Thêm cột' : 'Đổi tên cột') : (dialog?.type === 'new-card' ? 'Thêm công việc' : 'Đổi tên công việc')} onClose={close}>
      <Field label="Tên" required>{(id) => <Input id={id} value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />}</Field>{error && <p className="form-error" role="alert">{error}</p>}<div className="dialog-actions"><Button variant="secondary" onClick={close}>Hủy</Button><Button disabled={saving || !title.trim()} onClick={() => act(() => dialog.type === 'new-card' ? planningApi.createCard(dialog.payload.columnId, title) : dialog.type === 'edit-card' ? planningApi.updateCard(dialog.payload._id, title) : dialog.type === 'new-column' ? planningApi.createColumn(title) : planningApi.updateColumn(dialog.payload._id, title))}>Lưu</Button></div>
    </Dialog>
    <Dialog open={dialog?.type === 'card-menu'} title={dialog?.payload?.title || 'Công việc'} onClose={close}><div className="stack"><Button onClick={() => assign(dialog.payload)}>Giao thành nhiệm vụ</Button><Button variant="secondary" onClick={() => open('edit-card', dialog.payload)}>Đổi tên</Button>{columns.filter((column) => column._id !== dialog?.payload?.columnId).map((column) => <Button variant="secondary" key={column._id} onClick={() => move(dialog.payload, column._id)}>Chuyển sang {column.title}</Button>)}<Button variant="danger" onClick={() => act(() => planningApi.removeCard(dialog.payload._id))}>Xóa công việc</Button>{error && <p className="form-error">{error}</p>}</div></Dialog>
    <Dialog open={dialog?.type === 'column-menu'} title={dialog?.payload?.title || 'Cột'} onClose={close}><div className="stack"><Button variant="secondary" onClick={() => open('edit-column', dialog.payload)}>Đổi tên</Button><div className="grid-2"><Button variant="secondary" disabled={columns[0]?._id === dialog?.payload?._id} onClick={() => moveColumn(dialog.payload, -1)}>Chuyển sang trái</Button><Button variant="secondary" disabled={columns.at(-1)?._id === dialog?.payload?._id} onClick={() => moveColumn(dialog.payload, 1)}>Chuyển sang phải</Button></div>{columns.length > 1 && columns.filter((column) => column._id !== dialog?.payload?._id).map((column) => <Button variant="danger" key={column._id} onClick={() => act(() => planningApi.deleteColumn(dialog.payload._id, column._id))}>Xóa, chuyển thẻ sang {column.title}</Button>)}{error && <p className="form-error">{error}</p>}</div></Dialog>
  </main>;
}
