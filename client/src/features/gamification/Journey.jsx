import { useState } from 'react';
import { useAsync } from '../../app/useAsync';
import { Badge, Button, Dialog, ErrorState, Progress, Skeleton } from '../../components/ui';
import { gamificationApi, notificationApi } from '../../services/api';
import { Icon } from '../../components/ui/Icon';
import './journey.css';

function urlBase64ToUint8Array(value) {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

export function Journey() {
  const state = useAsync(async () => {
    const [dashboard, algorithm, activity, notificationSettings] = await Promise.all([gamificationApi.dashboard(), gamificationApi.algorithm(), gamificationApi.activity(), notificationApi.settings()]);
    return { dashboard, algorithm, activity, notificationSettings };
  });
  const [algorithmOpen, setAlgorithmOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  async function enableNotifications() {
    try {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) throw new Error('Thiết bị này chưa hỗ trợ Web Push.');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setNotificationMessage('Bạn chưa cấp quyền. StudyMed vẫn hoạt động bình thường.'); return; }
      const { publicKey } = await notificationApi.publicKey();
      if (!publicKey) throw new Error('Server chưa cấu hình VAPID.');
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      await notificationApi.subscribe(subscription.toJSON());
      setNotificationMessage('Đã bật nhắc nhở có kiểm soát.');
    } catch (error) { setNotificationMessage(error.response?.data?.message || error.message); }
  }

  if (state.loading) return <main className="page"><Skeleton height={190} /><div style={{ height: 16 }} /><Skeleton height={480} /></main>;
  if (state.error) return <main className="page"><ErrorState message={state.error} onRetry={state.reload} /></main>;
  const { dashboard, algorithm, activity } = state.data;
  const profile = dashboard.profile || {};
  const week = dashboard.week || {};
  const activities = activity.days || [];

  return <main className="page journey-page"><header className="page-head"><div><p className="page-kicker">Tiến bộ không cần ồn ào</p><h1 className="page-title">Hành trình</h1><p className="page-subtitle">XP ghi nhận công sức. Mục tiêu thích nghi theo nhịp học thật, không phải một con số tùy ý.</p></div><Button className="page-action" variant="secondary" onClick={() => setAlgorithmOpen(true)}>Cách tính mục tiêu</Button></header>
    <section className="journey-hero surface"><div className="level-crest"><Icon name="award" size={42} /><span>Level</span><strong>{profile.level || 1}</strong></div><div className="level-copy"><span className="eyebrow">Tổng kinh nghiệm</span><h2>{profile.totalXp || 0} XP</h2><div className="metric-line"><span>Tiến tới level {Number(profile.level || 1) + 1}</span><strong>{profile.xpIntoLevel || 0}/{profile.xpForNext || 200}</strong></div><Progress value={profile.xpIntoLevel || 0} max={profile.xpForNext || 200} label="Tiến độ level" /></div><div className="streak-mark"><Icon name="flame" size={29} /><strong>{profile.currentWeeklyStreak || 0}</strong><span>tuần streak</span></div></section>
    <section className="journey-grid"><article className="goal-card surface"><div className="section-title"><div><span className="eyebrow">Adaptive goal</span><h2>{week.targetXp || 200} XP tuần này</h2></div><Badge>{week.tierLabel || 'Hiệu chuẩn'}</Badge></div><div className="goal-progress"><strong>{week.earnedXp || 0}</strong><span>XP đã đạt</span><Progress value={week.earnedXp || 0} max={week.targetXp || 200} label="Adaptive goal tuần" /></div><p>{week.reason || 'Hệ thống đang thu thập đủ dữ liệu để cá nhân hóa mục tiêu.'}</p><Button variant="ghost" onClick={() => setAlgorithmOpen(true)}>Xem dữ liệu tính toán</Button></article>
      <article className="activity-card surface"><span className="eyebrow">28 ngày gần nhất</span><h2>Nhịp học của bạn</h2><div className="activity-grid" aria-label="Lịch hoạt động 28 ngày">{Array.from({ length: 28 }, (_, index) => { const item = activities[index] || {}; return <span key={item.date || index} className={`activity-cell intensity-${item.intensity || 0}`} title={`${item.date || 'Chưa có dữ liệu'}: ${item.xp || 0} XP`} />; })}</div><div className="activity-legend"><span>Ít</span><i className="intensity-1"/><i className="intensity-2"/><i className="intensity-3"/><span>Nhiều</span></div></article></section>
    <section className="badges-section"><div className="section-title"><div><span className="eyebrow">Cột mốc</span><h2>Huy hiệu</h2></div></div><div className="badge-grid">{(dashboard.achievements || []).map((item) => <article className="achievement surface" key={item.code}><span className="achievement-icon"><Icon name="award" /></span><h3>{item.title}</h3><p>{item.description}</p><Badge>{item.unlockedAt ? 'Đã mở' : `${item.progress || 0}/${item.target || 1}`}</Badge></article>)}</div></section>
    <section className="notification-panel surface"><div><span className="eyebrow">Nhắc nhở có chủ đích</span><h2>Giữ nhịp, không gây phiền</h2><p>Chỉ xin quyền khi bạn nhấn bật. Mặc định có quiet hours 22:00–07:00.</p>{notificationMessage && <p className="notification-message" role="status">{notificationMessage}</p>}</div><div className="cluster"><Button variant="secondary" onClick={() => setSettingsOpen(true)}>Tùy chỉnh</Button><Button icon="bell" onClick={enableNotifications}>Bật nhắc nhở</Button></div></section>
    <Dialog open={algorithmOpen} title="StudyMed tính mục tiêu thế nào?" onClose={() => setAlgorithmOpen(false)}><div className="algorithm-details"><p>{algorithm.summary}</p><dl><div><dt>Phiên bản</dt><dd>{algorithm.version || 'v1'}</dd></div><div><dt>Cửa sổ dữ liệu</dt><dd>{algorithm.window || 'Tối đa 28 ngày trong 8 tuần'}</dd></div><div><dt>Baseline</dt><dd>{algorithm.baselineXp || 0} XP</dd></div><div><dt>Percentile</dt><dd>P60 task XP × P60 ngày học/tuần</dd></div><div><dt>Tier</dt><dd>{algorithm.tier || 'calibration'}</dd></div><div><dt>Giới hạn đổi</dt><dd>+15% / −10% mỗi tuần thường</dd></div></dl><p className="muted">XP bonus và huy hiệu không quay lại làm tăng baseline. Planned XP thiếu không tự hạ mục tiêu.</p></div></Dialog>
    <Dialog open={settingsOpen} title="Tùy chỉnh nhắc nhở" onClose={() => setSettingsOpen(false)}><NotificationSettings initial={state.data.notificationSettings} onSaved={(message) => { setNotificationMessage(message); setSettingsOpen(false); }} /></Dialog>
  </main>;
}

function NotificationSettings({ initial, onSaved }) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const toggle = (key) => setSettings((current) => ({ ...current, [key]: !current[key] }));
  async function save() { setSaving(true); setError(''); try { await notificationApi.updateSettings(settings); onSaved('Đã lưu tùy chọn nhắc nhở.'); } catch (requestError) { setError(requestError.response?.data?.message || requestError.message); } finally { setSaving(false); } }
  return <div className="notification-settings"><label><span><strong>Đầu ngày</strong><small>Nhắc task trọng tâm lúc đã chọn.</small></span><input type="checkbox" checked={settings.dailyEnabled} onChange={() => toggle('dailyEnabled')} /></label><label><span><strong>Trước deadline</strong><small>Một lần, trước hạn hai giờ.</small></span><input type="checkbox" checked={settings.deadlineEnabled} onChange={() => toggle('deadlineEnabled')} /></label><label><span><strong>Nguy cơ mất streak</strong><small>18:00 Chủ nhật nếu chưa đạt goal.</small></span><input type="checkbox" checked={settings.streakEnabled} onChange={() => toggle('streakEnabled')} /></label><div className="grid-2"><label className="field"><span className="field-label">Nhắc đầu ngày</span><input className="input" type="time" value={settings.dailyTime} onChange={(event) => setSettings((current) => ({ ...current, dailyTime: event.target.value }))} /></label><label className="field"><span className="field-label">Quiet hours</span><div className="cluster"><input className="input" aria-label="Bắt đầu quiet hours" type="time" value={settings.quietStart} onChange={(event) => setSettings((current) => ({ ...current, quietStart: event.target.value }))} /><input className="input" aria-label="Kết thúc quiet hours" type="time" value={settings.quietEnd} onChange={(event) => setSettings((current) => ({ ...current, quietEnd: event.target.value }))} /></div></label></div>{error && <p className="form-error">{error}</p>}<div className="dialog-actions"><Button onClick={save} disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu tùy chọn'}</Button></div></div>;
}
