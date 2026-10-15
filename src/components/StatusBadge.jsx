import { Badge } from './ui';
import { DOG_STATUS, label } from '@/lib/constants';
import { daysUntil } from '@/lib/format';

const tone = {
  rescued: 'red', under_assessment: 'amber', under_treatment: 'red', recovering: 'amber',
  ready: 'green', adopted: 'ink', fostered: 'ink', released: 'grey', deceased: 'grey',
};
export function DogStatus({ status }) {
  return <Badge tone={tone[status] || 'grey'}>{label(DOG_STATUS, status)}</Badge>;
}

// Vaccine due badge: ✅ up to date / ⚠️ due soon / 🔴 overdue
export function DueBadge({ date, soon = 7 }) {
  if (!date) return <Badge tone="grey">No due date</Badge>;
  const d = daysUntil(date);
  if (d < 0) return <Badge tone="red">Overdue {Math.abs(d)}d</Badge>;
  if (d <= soon) return <Badge tone="amber">Due {d === 0 ? 'today' : `in ${d}d`}</Badge>;
  return <Badge tone="green">Up to date</Badge>;
}
