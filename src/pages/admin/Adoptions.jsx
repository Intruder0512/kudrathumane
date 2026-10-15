import { Link } from 'react-router-dom';
import ResourceManager from '@/components/ResourceManager';
import { PageTitle } from '@/layouts/AdminLayout';
import { list, update, useAsync } from '@/lib/data';
import { ADOPTION_STATUS, label } from '@/lib/constants';
import { fmtDate, inr, monthStart, today } from '@/lib/format';
import { Badge, Button, useToast } from '@/components/ui';

export default function Adoptions() {
  const toast = useToast();
  const { data: payments, reload: reloadPayments } = useAsync(() => list('payments', { select: 'id,virtual_adoption_id,status,for_month,paid_on', eq: { purpose: 'virtual_adoption' } }).catch(() => []), []);
  const thisMonth = (a) => (payments || []).find((p) => p.virtual_adoption_id === a.id && (p.for_month === monthStart() || (p.paid_on || '') >= monthStart()));
  const setStatus = async (r, status, reload) => {
    try {
      await update('virtual_adoptions', r.id, { status, ...(status === 'cancelled' ? { cancel_reason: window.prompt('Reason for cancelling?') || r.cancel_reason } : {}) });
      toast(`Adoption ${status === 'active' ? 'activated' : status}`);
      reload();
      reloadPayments();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  return (
    <div>
      <PageTitle title="Virtual adoptions">Supporters who pay monthly for a dog’s care. Activate an adoption once its first payment is confirmed.</PageTitle>
      <ResourceManager
        table="virtual_adoptions" select="*, dogs(name)" noun="adoption" order={['created_at', false]} addLabel="Add adoption"
        fields={[
          { name: 'dog_id', label: 'Dog', type: 'dog', required: true },
          { name: 'supporter_name', label: 'Supporter name', required: true },
          { name: 'supporter_email', label: 'Email', type: 'email' },
          { name: 'supporter_phone', label: 'Phone' },
          { name: 'monthly_amount', label: 'Monthly amount (₹)', type: 'number', required: true, default: 5000 },
          { name: 'start_date', label: 'Start date', type: 'date', default: today, required: true },
          { name: 'status', label: 'Status', type: 'select', options: ADOPTION_STATUS, default: 'active', required: true },
          { name: 'cancel_reason', label: 'Cancellation reason', show: (f) => f.status === 'cancelled', span: 2 },
        ]}
        columns={[
          { label: 'Dog', text: (r) => r.dogs?.name, render: (r) => <Link to={`/admin/dogs/${r.dog_id}`} className="font-semibold underline">{r.dogs?.name}</Link> },
          { label: 'Supporter', text: (r) => `${r.supporter_name} ${r.supporter_email || ''}`, render: (r) => <span>{r.supporter_name}<span className="block text-xs text-ink-400">{r.supporter_email} {r.supporter_phone}</span></span> },
          { label: 'Monthly', key: 'monthly_amount', render: (r) => inr(r.monthly_amount) },
          { label: 'Since', key: 'start_date', render: (r) => fmtDate(r.start_date), csv: (r) => r.start_date },
          {
            label: 'This month', text: (r) => thisMonth(r)?.status || 'not paid',
            render: (r) => {
              if (r.status !== 'active') return '—';
              const p = thisMonth(r);
              return <Badge tone={!p ? 'red' : p.status === 'completed' ? 'green' : p.status === 'failed' ? 'red' : 'amber'}>{!p ? 'Not paid yet' : p.status === 'completed' ? 'Paid' : p.status === 'failed' ? 'Failed' : 'To confirm'}</Badge>;
            },
          },
          { label: 'Status', text: (r) => r.status, render: (r) => <span><Badge tone={r.status === 'active' ? 'green' : r.status === 'pending' ? 'amber' : 'grey'}>{label(ADOPTION_STATUS, r.status)}</Badge>{r.cancel_reason && <span className="mt-1 block max-w-48 text-xs text-ink-400">{r.cancel_reason}</span>}</span> },
        ]}
        search={['supporter_name', 'supporter_email', 'supporter_phone', (r) => r.dogs?.name]}
        filters={[{ name: 'status', label: 'Statuses', options: ADOPTION_STATUS }]}
        dateField="start_date"
        csvName="virtual-adoptions"
        summary={(rows) => {
          const active = rows.filter((r) => r.status === 'active');
          return <p className="rounded-xl bg-white px-4 py-3 ring-1 ring-wall-3"><b>{active.length}</b> active adoptions committing <b>{inr(active.reduce((s, r) => s + Number(r.monthly_amount), 0))}</b> a month · <b>{rows.filter((r) => r.status === 'pending').length}</b> waiting for activation</p>;
        }}
        rowActions={(r, reload) => (
          <>
            {r.status === 'pending' && <Button size="sm" onClick={() => setStatus(r, 'active', reload)}>Activate</Button>}
            {['pending', 'active'].includes(r.status) && <Button size="sm" variant="ghost" onClick={() => setStatus(r, 'cancelled', reload)}>Cancel</Button>}
          </>
        )}
      />
    </div>
  );
}
