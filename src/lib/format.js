export const inr = (n) =>
  n === null || n === undefined || n === ''
    ? '—'
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n));

export const num = (n) => new Intl.NumberFormat('en-IN').format(Number(n || 0));

export const fmtDate = (d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!d) return '—';
  const date = typeof d === 'string' && d.length === 10 ? new Date(`${d}T00:00:00`) : new Date(d);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', opts);
};

export const today = () => toISODate(new Date());
export const toISODate = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
export const addDays = (d, n) => {
  const x = new Date(typeof d === 'string' ? `${d}T00:00:00` : d);
  x.setDate(x.getDate() + n);
  return toISODate(x);
};
export const addMonths = (d, n) => {
  const x = new Date(typeof d === 'string' ? `${d}T00:00:00` : d);
  x.setMonth(x.getMonth() + n);
  return toISODate(x);
};
export const daysUntil = (d) => {
  if (!d) return null;
  const t = new Date(`${today()}T00:00:00`);
  const x = new Date(`${String(d).slice(0, 10)}T00:00:00`);
  return Math.round((x - t) / 86400000);
};
export const monthStart = (d = new Date()) => toISODate(new Date(new Date(d).getFullYear(), new Date(d).getMonth(), 1));
export const monthEnd = (d = new Date()) => toISODate(new Date(new Date(d).getFullYear(), new Date(d).getMonth() + 1, 0));
export const ageLabel = (y) => {
  if (y === null || y === undefined || y === '') return 'Age unknown';
  const n = Number(y);
  if (n < 1) return `${Math.max(1, Math.round(n * 12))} months`;
  return `${n % 1 === 0 ? n : n.toFixed(1)} ${n === 1 ? 'year' : 'years'}`;
};
