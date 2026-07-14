import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useRole } from '../app/RoleContext';
import { Button, Dialog } from '../components/ui';
import { Icon } from '../components/ui/Icon';
import './app-shell.css';

const studentNav = [
  { to: '/student/today', label: 'Hôm nay', icon: 'today' },
  { to: '/student/tasks', label: 'Nhiệm vụ', icon: 'tasks' },
  { to: '/student/journey', label: 'Hành trình', icon: 'journey' },
  { to: '/student/reflections', label: 'Phản hồi', icon: 'reflection' },
];
const mentorNav = [
  { to: '/mentor/overview', label: 'Tổng quan', icon: 'overview' },
  { to: '/mentor/planning', label: 'Kế hoạch', icon: 'planning' },
  { to: '/mentor/progress', label: 'Tiến độ', icon: 'progress' },
  { to: '/mentor/reflections', label: 'Phản hồi', icon: 'reflection' },
];

function isNested(pathname) {
  return /\/tasks\/(new|[^/]+(?:\/edit)?)$/.test(pathname) || /\/reflections\/(new|[^/]+)$/.test(pathname);
}

function Brand() {
  return <div className="brand"><span className="brand-mark" aria-hidden="true"><span /></span><span className="brand-name">StudyMed</span><span className="project-tag">001</span></div>;
}

export function AppShell() {
  const { role, setRole } = useRole();
  const location = useLocation();
  const navigate = useNavigate();
  const [online, setOnline] = useState(navigator.onLine);
  const [switchOpen, setSwitchOpen] = useState(false);
  const navItems = role === 'mentor' ? mentorNav : studentNav;
  const nested = isNested(location.pathname);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);

  const confirmSwitch = useCallback(() => {
    const next = role === 'mentor' ? 'student' : 'mentor';
    setRole(next);
    setSwitchOpen(false);
    navigate(next === 'mentor' ? '/mentor/overview' : '/student/today', { replace: true });
  }, [navigate, role, setRole]);

  return (
    <div className="app-frame">
      {!online && <div className="offline-banner" role="status">Đang ngoại tuyến — bạn vẫn xem được app shell, nhưng không thể lưu thay đổi.</div>}
      <aside className="side-nav">
        <Brand />
        <nav aria-label={`Điều hướng ${role === 'mentor' ? 'Mentor' : 'Student'}`}>
          {navItems.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon name={item.icon} /><span>{item.label}</span></NavLink>)}
        </nav>
        <button className="role-switch" onClick={() => setSwitchOpen(true)}><span className="avatar">{role === 'mentor' ? 'M' : 'S'}</span><span><strong>{role === 'mentor' ? 'Mentor' : 'Student'}</strong><small>Chuyển không gian</small></span><Icon name="next" size={18} /></button>
      </aside>

      <header className={`mobile-top ${nested ? 'nested-top' : ''}`}>
        {nested ? <button className="mobile-back" onClick={() => navigate(-1)}><Icon name="back" /><span>Trở về</span></button> : <Brand />}
        <button className="mobile-avatar" aria-label="Chuyển không gian" onClick={() => setSwitchOpen(true)}>{role === 'mentor' ? 'M' : 'S'}</button>
      </header>

      <main className="app-main"><Outlet /></main>

      {!nested && <nav className="bottom-nav" aria-label="Điều hướng chính">{navItems.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `bottom-link ${isActive ? 'active' : ''}`}><Icon name={item.icon} size={21} /><span>{item.label}</span></NavLink>)}</nav>}

      <Dialog open={switchOpen} title={`Chuyển sang ${role === 'mentor' ? 'Student' : 'Mentor'}?`} onClose={() => setSwitchOpen(false)}>
        <p className="muted">Mỗi không gian có điều hướng và quyền riêng. Lịch sử Back sẽ không đưa bạn trở lại role trước.</p>
        <div className="dialog-actions"><Button variant="secondary" onClick={() => setSwitchOpen(false)}>Ở lại</Button><Button onClick={confirmSwitch}>Chuyển không gian</Button></div>
      </Dialog>
    </div>
  );
}
