import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Loader2, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const cx = (...c) => c.filter(Boolean).join(' ');
export { cx };

const btnBase =
  'inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap';
const btnVariants = {
  primary: 'bg-marigold text-ink hover:bg-marigold-300',
  dark: 'bg-ink text-white hover:bg-ink-500',
  outline: 'border-2 border-ink text-ink hover:bg-ink hover:text-white',
  ghost: 'text-ink hover:bg-wall-2',
  danger: 'bg-sindoor text-white hover:bg-sindoor/90',
  soft: 'bg-white text-ink border border-wall-3 hover:border-ink-300',
};
const btnSizes = {
  sm: 'text-sm px-3 py-1.5 rounded-lg',
  md: 'text-[15px] px-4 py-2.5 rounded-xl',
  lg: 'text-base px-6 py-3.5 rounded-2xl',
};

export function Button({ variant = 'primary', size = 'md', loading, className, children, ...props }) {
  return (
    <button className={cx(btnBase, btnVariants[variant], btnSizes[size], className)} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function LinkButton({ to, href, variant = 'primary', size = 'md', className, children, ...props }) {
  const cls = cx(btnBase, btnVariants[variant], btnSizes[size], className);
  if (href) return <a href={href} className={cls} {...props}>{children}</a>;
  return <Link to={to} className={cls} {...props}>{children}</Link>;
}

export function Field({ label, hint, error, required, children, className }) {
  return (
    <label className={cx('block', className)}>
      {label && (
        <span className="label">
          {label}
          {required && <span className="text-sindoor"> *</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="hint block">{hint}</span>}
      {error && <span className="mt-1 block text-[13px] font-medium text-sindoor">{error}</span>}
    </label>
  );
}

export const Input = (props) => <input className={cx('input', props.className)} {...props} />;
export const Textarea = (props) => <textarea rows={props.rows || 3} className={cx('input', props.className)} {...props} />;
export function Select({ options = [], placeholder, className, ...props }) {
  return (
    <select className={cx('input pr-8', className)} {...props}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map(([v, l]) => (
        <option key={v} value={v}>{l}</option>
      ))}
    </select>
  );
}
export function Checkbox({ label, hint, className, ...props }) {
  return (
    <label className={cx('flex cursor-pointer items-start gap-3', className)}>
      <input type="checkbox" className="mt-1 h-5 w-5 flex-none rounded-sm border-wall-3 accent-ink" {...props} />
      <span>
        <span className="font-medium">{label}</span>
        {hint && <span className="hint block">{hint}</span>}
      </span>
    </label>
  );
}

const tones = {
  ink: 'bg-ink-50 text-ink',
  green: 'bg-neem-50 text-neem',
  amber: 'bg-marigold-100 text-marigold-700',
  red: 'bg-sindoor-50 text-sindoor',
  grey: 'bg-wall-2 text-ink-400',
};
export function Badge({ tone = 'ink', children, className }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone], className)}>{children}</span>;
}

export function Spinner({ label = 'Loading' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-ink-400" role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> {label}…
    </div>
  );
}

export function Empty({ title, children, action }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-wall-3 px-6 py-12 text-center">
      <p className="font-display text-lg font-bold">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-md text-ink-400">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorNote({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl bg-sindoor-50 p-4 text-sindoor" role="alert">
      <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" />
      <div className="flex-1 text-sm">
        <p className="font-semibold">{error.message || String(error)}</p>
        {onRetry && (
          <button className="mt-1 underline" onClick={onRetry}>Try again</button>
        )}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide, footer }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    setTimeout(() => ref.current?.querySelector('input,select,textarea,button')?.focus(), 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx('flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-wall shadow-2xl sm:rounded-2xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}
      >
        <div className="flex items-center justify-between gap-4 border-b border-wall-3 px-5 py-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-wall-2" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-wall-3 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Confirm({ open, title, message, confirmLabel = 'Delete', onConfirm, onClose, loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto border-b border-wall-3 px-1" role="tablist">
      {tabs.map(([v, l, count]) => (
        <button
          key={v}
          role="tab"
          aria-selected={value === v}
          onClick={() => onChange(v)}
          className={cx(
            '-mb-px whitespace-nowrap border-b-[3px] px-3 py-2.5 text-sm font-semibold',
            value === v ? 'border-marigold text-ink' : 'border-transparent text-ink-400 hover:text-ink'
          )}
        >
          {l}
          {count !== undefined && <span className="ml-1.5 rounded-full bg-wall-2 px-1.5 text-xs">{count}</span>}
        </button>
      ))}
    </div>
  );
}

// ── Toasts ─────────────────────────────────────────
const ToastCtx = createContext(() => {});
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, tone = 'success') => {
    const id = Math.random();
    setItems((x) => [...x, { id, message, tone }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 4500);
  }, []);
  const icons = { success: CheckCircle2, error: AlertTriangle, info: Info };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-60 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col gap-2" aria-live="polite">
        {items.map((t) => {
          const Icon = icons[t.tone] || Info;
          return (
            <div key={t.id} className={cx('pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg', t.tone === 'error' ? 'bg-sindoor text-white' : 'bg-ink text-white')}>
              <Icon className="mt-0.5 h-4 w-4 flex-none" /> {t.message}
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);
