import { useEffect, useId, useRef } from 'react';
import { Icon } from './Icon';

export function Button({ children, variant = 'primary', icon, className = '', ...props }) {
  return <button className={`btn btn-${variant} ${className}`} {...props}>{icon && <Icon name={icon} size={19} />}{children}</button>;
}

export function IconButton({ icon, label, ...props }) {
  return <button className="icon-btn" aria-label={label} title={label} {...props}><Icon name={icon} /></button>;
}

export function Field({ label, hint, children, required }) {
  const id = useId();
  return <label className="field" htmlFor={id}><span className="field-label">{label}{required && <span aria-hidden="true"> *</span>}</span>{typeof children === 'function' ? children(id) : children}{hint && <span className="field-hint">{hint}</span>}</label>;
}

export function Input(props) { return <input className="input" {...props} />; }
export function Select(props) { return <select className="select" {...props} />; }
export function Textarea(props) { return <textarea className="textarea" {...props} />; }
export function Badge({ children, tone = '' }) { return <span className={`badge ${tone ? `badge-${tone}` : ''}`}>{children}</span>; }

export function Progress({ value = 0, max = 100, label }) {
  const percent = Math.max(0, Math.min(100, (value / Math.max(max, 1)) * 100));
  return <div role="progressbar" aria-label={label} aria-valuemin="0" aria-valuemax={max} aria-valuenow={value} className="progress-track"><div className="progress-fill" style={{ width: `${percent}%` }} /></div>;
}

export function Tabs({ items, value, onChange, label }) {
  return <div className="tabs" role="tablist" aria-label={label}>{items.map((item) => <button key={item.value} type="button" role="tab" className="tab" aria-selected={value === item.value} onClick={() => onChange(item.value)}>{item.label}</button>)}</div>;
}

export function Dialog({ open, title, onClose, children, sheet = false }) {
  const closeRef = useRef(null);
  const dialogRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    closeRef.current?.focus();
    const handler = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const focusable = [...(dialogRef.current?.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])') || [])];
        if (!focusable.length) return;
        const first = focusable[0]; const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handler);
    return () => { document.removeEventListener('keydown', handler); previous?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section ref={dialogRef} className={`dialog ${sheet ? 'sheet' : ''}`} role="dialog" aria-modal="true" aria-labelledby="dialog-title"><header className="dialog-head"><h2 id="dialog-title">{title}</h2><IconButton ref={closeRef} icon="close" label="Đóng" onClick={onClose} /></header>{children}</section></div>;
}

export function Drawer(props) { return <Dialog {...props} sheet />; }
export function Skeleton({ height = 80 }) { return <div className="skeleton" style={{ height }} aria-hidden="true" />; }
export function EmptyState({ title, description, action }) { return <section className="status-panel"><div><h2>{title}</h2><p>{description}</p>{action}</div></section>; }
export function ErrorState({ message, onRetry }) { return <EmptyState title="Có điều chưa ổn" description={message || 'Không thể tải dữ liệu lúc này.'} action={onRetry && <Button onClick={onRetry}>Thử lại</Button>} />; }
export function Toast({ children }) { return children ? <div className="toast" role="status">{children}</div> : null; }
