import { Link } from 'react-router-dom';
import { AlertTriangle, Syringe, Bug, Boxes, Home, Search, Mail, IndianRupee, DoorOpen } from 'lucide-react';
import { list, useAsync } from '@/lib/data';
import { useAuth } from '@/lib/auth';
import { IN_CARE } from '@/lib/constants';
import { addDays, daysUntil, fmtDate, inr, monthStart, today } from '@/lib/format';
import { PageTitle } from '@/layouts/AdminLayout';
import { Spinner, cx } from '@/components/ui';

const safe = (p) => p.catch(() => []);

export default function Overview() {
  const { isAdmin, user } = useAuth();
  const { data, loading } = useAsync(async () => {
    const soon = addDays(today(), 7);
    const m = monthStart();
    const [dogs, rescues, releases, vacc, deworm, treatments, payments, adoptions, stock, apps, lf, msgs] = await Promise.all([
      safe(list('dogs', { select: 'id,name,status' })),
      safe(list('rescues', { select: 'id,rescue_date', gte: { rescue_date: m } })),
      safe(list('releases', { select: 'id,dog_id,release_date,follow_up_7_done,follow_up_30_done,dogs(name)', order: ['release_date', false] })),
      safe(list('vaccinations', { select: 'id,vaccine,next_due_date,date_administered,dog_id,dogs(name,status)', order: ['date_administered', false] })),
      safe(list('dewormings', { select: 'id,kind,next_due_date,date_given,dog_id,dogs(name,status)', order: ['date_given', false] })),
      safe(list('treatments', { select: 'id', eq: { outcome: 'ongoing' } })),
      safe(list('payments', { select: 'id,amount,status,paid_on' })),
      safe(list('virtual_adoptions', { select: 'id,status' })),
      safe(list('inventory_items', { select: 'id,name,quantity,unit,reorder_level' })),
      safe(list('foster_applications', { select: 'id', eq: { status: 'pending' } })),
      safe(list('lost_found_reports', { select: 'id', eq: { approved: false } })),
      safe(list('contact_messages', { select: 'id', eq: { handled: false } })),
    ]);
    // Latest dose per dog + vaccine (rows come newest first), for dogs still in our care, due within 7 days
    const latest = (rows, key) => {
      const seen = new Set();
      return rows
        .filter((r) => {
          const k = key(r);
          if (seen.has(k)) return false;
          seen.add(k);
          return IN_CARE.concat('fostered').includes(r.dogs?.status) && r.next_due_date && r.next_due_date <= soon;
        })
        .sort((a, b) => a.next_due_date.localeCompare(b.next_due_date));
    };
    return {
      inCare: dogs.filter((d) => IN_CARE.includes(d.status)).length,
      fostered: dogs.filter((d) => d.status === 'fostered').length,
      admitted: rescues.length,
      released: releases.filter((r) => r.release_date && r.release_date >= m).length,
      vacc: latest(vacc, (r) => `${r.dog_id}${r.vaccine}`),
      deworm: latest(deworm, (r) => `${r.dog_id}${r.kind}`),
      activeTreatments: treatments.length,
      fundsMonth: payments.filter((p) => p.status === 'completed' && p.paid_on >= m).reduce((s, p) => s + Number(p.amount), 0),
      fundsAll: payments.filter((p) => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0),
      pendingPayments: payments.filter((p) => p.status === 'pending').length,
      activeAdoptions: adoptions.filter((a) => a.status === 'active').length,
      lowStock: stock.filter((s) => Number(s.quantity) <= Number(s.reorder_level)),
      apps: apps.length,
      lf: lf.length,
      msgs: msgs.length,
      followUps: releases.filter((r) => r.release_date && ((!r.follow_up_7_done && daysUntil(addDays(r.release_date, 7)) <= 0) || (!r.follow_up_30_done && daysUntil(addDays(r.release_date, 30)) <= 0))),
    };
  }, []);

  if (loading || !data) return <Spinner />;
  const d = data;
  const alerts = [
    d.vacc.length && { icon: Syringe, tone: 'red', to: '/admin/medical', text: `${d.vacc.length} vaccination${d.vacc.length > 1 ? 's' : ''} due or overdue in the next 7 days` },
    d.deworm.length && { icon: Bug, tone: 'amber', to: '/admin/medical?tab=deworming', text: `${d.deworm.length} deworming / tick treatment${d.deworm.length > 1 ? 's' : ''} due` },
    isAdmin && d.pendingPayments && { icon: IndianRupee, tone: 'amber', to: '/admin/payments', text: `${d.pendingPayments} payment${d.pendingPayments > 1 ? 's' : ''} waiting to be matched with your bank / UPI statement` },
    isAdmin && d.lowStock.length && { icon: Boxes, tone: 'amber', to: '/admin/inventory', text: `Low stock: ${d.lowStock.map((s) => s.name).join(', ')}` },
    isAdmin && d.apps && { icon: Home, tone: 'ink', to: '/admin/fostering', text: `${d.apps} new foster application${d.apps > 1 ? 's' : ''}` },
    d.lf && { icon: Search, tone: 'ink', to: '/admin/lost-found', text: `${d.lf} lost & found report${d.lf > 1 ? 's' : ''} to check` },
    isAdmin && d.msgs && { icon: Mail, tone: 'ink', to: '/admin/messages', text: `${d.msgs} unread message${d.msgs > 1 ? 's' : ''}` },
    d.followUps.length && { icon: DoorOpen, tone: 'amber', to: '/admin/releases', text: `${d.followUps.length} post-release follow-up call${d.followUps.length > 1 ? 's' : ''} due` },
  ].filter(Boolean);

  return (
    <div>
      <PageTitle title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}${user.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}`}>
        Here’s what needs attention at the shelter today, {fmtDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}.
      </PageTitle>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Dogs in the shelter" value={d.inCare} sub={`${d.fostered} in foster homes`} to="/admin/dogs" />
        <Stat label="Admitted this month" value={d.admitted} sub={`${d.released} released this month`} to="/admin/rescues" />
        <Stat label="Active treatments" value={d.activeTreatments} sub={`${d.vacc.length} vaccines due this week`} to="/admin/medical?tab=treatments" />
        {isAdmin && <Stat label="Raised this month" value={inr(d.fundsMonth)} sub={`${inr(d.fundsAll)} all time`} to="/admin/payments" />}
        {isAdmin && <Stat label="Active virtual adoptions" value={d.activeAdoptions} to="/admin/adoptions" />}
        {isAdmin && <Stat label="Pending payments" value={d.pendingPayments} to="/admin/payments" warn={d.pendingPayments > 0} />}
      </div>

      <h2 className="mt-10 text-xl font-bold">Needs attention</h2>
      {alerts.length === 0 ? (
        <p className="mt-3 rounded-xl bg-neem-50 p-4 font-semibold text-neem">All clear — nothing overdue.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {alerts.map((a, i) => (
            <li key={i}>
              <Link to={a.to} className={cx('flex items-center gap-3 rounded-xl px-4 py-3 font-medium ring-1', a.tone === 'red' ? 'bg-sindoor-50 text-sindoor ring-sindoor-100' : a.tone === 'amber' ? 'bg-marigold-50 text-marigold-700 ring-marigold-100' : 'bg-white ring-wall-3')}>
                <a.icon className="h-5 w-5 flex-none" /> <span className="flex-1">{a.text}</span> <span className="text-sm underline">Open</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {d.vacc.length > 0 && (
        <>
          <h2 className="mt-10 text-xl font-bold">Vaccination schedule — next 7 days</h2>
          <div className="table-wrap mt-3">
            <table className="table">
              <thead><tr><th>Dog</th><th>Vaccine</th><th>Due</th></tr></thead>
              <tbody>
                {d.vacc.map((v) => (
                  <tr key={v.id}>
                    <td><Link className="font-semibold underline" to={`/admin/dogs/${v.dog_id}`}>{v.dogs?.name}</Link></td>
                    <td>{v.vaccine}</td>
                    <td className={daysUntil(v.next_due_date) < 0 ? 'font-semibold text-sindoor' : ''}>
                      {fmtDate(v.next_due_date)} {daysUntil(v.next_due_date) < 0 ? <AlertTriangle className="inline h-4 w-4" /> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub, to, warn }) {
  return (
    <Link to={to} className={cx('rounded-2xl bg-white p-5 ring-1 hover:ring-ink-300', warn ? 'ring-marigold' : 'ring-wall-3')}>
      <p className="text-sm font-medium text-ink-400">{label}</p>
      <p className="mt-1 font-display text-3xl font-extrabold">{value}</p>
      {sub && <p className="mt-1 text-sm text-ink-400">{sub}</p>}
    </Link>
  );
}
