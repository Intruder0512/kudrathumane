import { useMemo, useState } from 'react';
import { FileDown, Download } from 'lucide-react';
import { PageTitle } from '@/layouts/AdminLayout';
import { list, useAsync, getSettings } from '@/lib/data';
import { IN_CARE } from '@/lib/constants';
import { inr, num, today } from '@/lib/format';
import { impactReport, rs } from '@/lib/pdf';
import { downloadCSV } from '@/lib/csv';
import { Button, Select, Spinner } from '@/components/ui';

const ym = (d) => (d || '').slice(0, 7);
const monthName = (m) => new Date(`${m}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
const lastMonths = (n) => {
  const out = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
};

export default function Reports() {
  const months = lastMonths(18);
  const [month, setMonth] = useState(months[0]);
  const { data, loading } = useAsync(async () => {
    const t = (p) => p.catch(() => []);
    const [dogs, rescues, releases, vacc, deworm, treatments, payments, adoptions, inkind, hours, placements] = await Promise.all([
      t(list('dogs', { select: 'id,status,intake_date' })),
      t(list('rescues', { select: 'id,rescue_date,rescue_type,area' })),
      t(list('releases', { select: 'id,release_date,release_type' })),
      t(list('vaccinations', { select: 'id,dog_id,vaccine,date_administered,next_due_date', order: ['date_administered', false] })),
      t(list('dewormings', { select: 'id,date_given' })),
      t(list('treatments', { select: 'id,start_date,end_date,outcome' })),
      t(list('payments', { select: 'id,amount,status,paid_on,purpose' })),
      t(list('virtual_adoptions', { select: 'id,start_date,status' })),
      t(list('in_kind_donations', { select: 'id,donation_date,estimated_value' })),
      t(list('volunteer_hours', { select: 'id,worked_on,hours' })),
      t(list('foster_placements', { select: 'id,start_date' })),
    ]);
    return { dogs, rescues, releases, vacc, deworm, treatments, payments, adoptions, inkind, hours, placements };
  }, []);

  const m = useMemo(() => {
    if (!data) return null;
    const inM = (d) => ym(d) === month;
    const paid = data.payments.filter((p) => p.status === 'completed' && inM(p.paid_on));
    // Vaccination compliance: dogs in care whose every vaccine is within its due date
    const inCare = data.dogs.filter((d) => IN_CARE.concat('fostered').includes(d.status));
    const latest = {};
    for (const v of data.vacc) {
      const k = `${v.dog_id}|${v.vaccine}`;
      if (!latest[k]) latest[k] = v;
    }
    const compliant = inCare.filter((d) => {
      const vs = Object.values(latest).filter((v) => v.dog_id === d.id);
      return vs.length > 0 && vs.every((v) => !v.next_due_date || v.next_due_date >= today());
    }).length;
    return {
      rows: [
        ['Dogs rescued', data.rescues.filter((r) => inM(r.rescue_date)).length],
        ['Dogs released / rehomed', data.releases.filter((r) => inM(r.release_date)).length],
        ['Treatments started', data.treatments.filter((r) => inM(r.start_date)).length],
        ['Dogs recovered', data.treatments.filter((r) => r.outcome === 'recovered' && inM(r.end_date)).length],
        ['Vaccines given', data.vacc.filter((v) => inM(v.date_administered)).length],
        ['Dewormings given', data.deworm.filter((v) => inM(v.date_given)).length],
        ['New virtual adoptions', data.adoptions.filter((a) => inM(a.start_date)).length],
        ['New foster placements', data.placements.filter((a) => inM(a.start_date)).length],
        ['Funds raised', rs(paid.reduce((s, p) => s + Number(p.amount), 0))],
        ['Supplies donated (value)', rs(data.inkind.filter((d) => inM(d.donation_date)).reduce((s, d) => s + Number(d.estimated_value || 0), 0))],
        ['Volunteer hours', num(data.hours.filter((h) => inM(h.worked_on)).reduce((s, h) => s + Number(h.hours), 0))],
        ['Vaccination compliance (today)', inCare.length ? `${Math.round((compliant / inCare.length) * 100)}%` : '—'],
      ],
      inCare: inCare.length,
      compliant,
      trend: lastMonths(6).reverse().map((k) => ({
        k,
        rescues: data.rescues.filter((r) => ym(r.rescue_date) === k).length,
        funds: data.payments.filter((p) => p.status === 'completed' && ym(p.paid_on) === k).reduce((s, p) => s + Number(p.amount), 0),
      })),
    };
  }, [data, month]);

  const pdf = async () => {
    const settings = await getSettings();
    impactReport({ monthLabel: monthName(month), metrics: m.rows, settings, highlights: [`${m.inCare} dogs are in our care, and ${m.compliant} are fully up to date on vaccinations.`] });
  };

  return (
    <div>
      <PageTitle title="Reports" actions={m && (
        <>
          <Button variant="soft" onClick={() => downloadCSV(`impact-${month}`, m.rows, [{ label: 'Measure', value: (r) => r[0] }, { label: monthName(month), value: (r) => r[1] }])}><Download className="h-4 w-4" /> CSV</Button>
          <Button onClick={pdf}><FileDown className="h-4 w-4" /> Download PDF for donors</Button>
        </>
      )}>
        Monthly impact in numbers — ready to send to donors and trustees, or post on social media.
      </PageTitle>
      <Select className="mb-6 w-60" value={month} onChange={(e) => setMonth(e.target.value)} options={months.map((x) => [x, monthName(x)])} aria-label="Month" />
      {loading || !m ? <Spinner /> : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {m.rows.map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-white p-5 ring-1 ring-wall-3">
                <p className="text-sm text-ink-400">{k}</p>
                <p className="mt-1 font-display text-3xl font-extrabold">{String(v).replace('Rs. ', '₹')}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Bars title="Rescues — last 6 months" data={m.trend.map((t) => [t.k, t.rescues])} fmt={(v) => v} />
            <Bars title="Funds raised — last 6 months" data={m.trend.map((t) => [t.k, t.funds])} fmt={inr} />
          </div>
        </>
      )}
    </div>
  );
}

function Bars({ title, data, fmt }) {
  const max = Math.max(1, ...data.map((d) => d[1]));
  return (
    <figure className="rounded-2xl bg-white p-5 ring-1 ring-wall-3">
      <figcaption className="font-bold">{title}</figcaption>
      <div className="mt-4 flex h-48 items-end gap-3" role="img" aria-label={`${title}: ${data.map(([k, v]) => `${monthName(k)} ${fmt(v)}`).join(', ')}`}>
        {data.map(([k, v]) => (
          <div key={k} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-xs font-semibold">{fmt(v)}</span>
            <div className="w-full max-w-[44px] rounded-t-md bg-marigold" style={{ height: `${Math.max(2, (v / max) * 100)}%` }} />
            <span className="text-xs text-ink-400">{new Date(`${k}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short' })}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}
