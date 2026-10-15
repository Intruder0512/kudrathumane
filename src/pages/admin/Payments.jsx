import { Download } from 'lucide-react';
import ResourceManager from '@/components/ResourceManager';
import { PageTitle } from '@/layouts/AdminLayout';
import { list, update, useAsync, getSettings } from '@/lib/data';
import { PAYMENT_METHOD, PAYMENT_STATUS, PURPOSE, label } from '@/lib/constants';
import { fmtDate, inr, monthStart, today } from '@/lib/format';
import { donationReceipt } from '@/lib/pdf';
import { Badge, Button, Select, useToast } from '@/components/ui';

// Receipt numbers run per Indian financial year: KHLT/2026-27/0001
async function nextReceiptNumber() {
  const now = new Date();
  const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const prefix = `KHLT/${fyStart}-${String(fyStart + 1).slice(2)}/`;
  const rows = await list('payments', { select: 'receipt_number' });
  const used = rows.map((r) => r.receipt_number).filter((n) => n?.startsWith(prefix)).map((n) => Number(n.slice(prefix.length)) || 0);
  return `${prefix}${String((used.length ? Math.max(...used) : 0) + 1).padStart(4, '0')}`;
}

function AdoptionPicker({ form, set }) {
  const { data } = useAsync(() => list('virtual_adoptions', { select: 'id,supporter_name,supporter_email,supporter_phone,monthly_amount,dogs(name)', order: ['created_at', false] }).catch(() => []), []);
  return (
    <Select value={form.virtual_adoption_id || ''} placeholder="Choose the adoption"
      options={(data || []).map((a) => [a.id, `${a.dogs?.name} — ${a.supporter_name} (${inr(a.monthly_amount)}/month)`])}
      onChange={(e) => {
        const a = (data || []).find((x) => x.id === e.target.value);
        set({ virtual_adoption_id: e.target.value, ...(a ? { donor_name: a.supporter_name, donor_email: a.supporter_email, donor_phone: a.supporter_phone, amount: form.amount || a.monthly_amount } : {}) });
      }} />
  );
}

export default function Payments() {
  const toast = useToast();
  const confirm = async (r, reload) => {
    try {
      const receipt_number = r.receipt_number || (await nextReceiptNumber());
      await update('payments', r.id, { status: 'completed', receipt_number });
      if (r.virtual_adoption_id && r.virtual_adoptions?.status === 'pending') await update('virtual_adoptions', r.virtual_adoption_id, { status: 'active' });
      toast(`Confirmed — receipt ${receipt_number}`);
      reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const fail = async (r, reload) => {
    await update('payments', r.id, { status: 'failed' }).catch((e) => toast(e.message, 'error'));
    reload();
  };
  return (
    <div>
      <PageTitle title="Payments & donations">
        Every rupee in: monthly virtual-adoption payments and one-time donations. Check each pending UTR against your bank or UPI statement, then confirm it.
      </PageTitle>
      <ResourceManager
        table="payments" select="*, virtual_adoptions(status, dogs(name))" noun="payment" order={['paid_on', false]} addLabel="Record a payment"
        fields={[
          { name: 'purpose', label: 'For', type: 'select', options: PURPOSE, default: 'donation', required: true },
          { name: 'virtual_adoption_id', label: 'Virtual adoption', type: 'custom', show: (f) => f.purpose === 'virtual_adoption', render: (f, set) => <AdoptionPicker form={f} set={set} /> },
          { name: 'donor_name', label: 'Paid by', required: true },
          { name: 'amount', label: 'Amount (₹)', type: 'number', required: true },
          { name: 'donor_email', label: 'Email', type: 'email' },
          { name: 'donor_phone', label: 'Phone' },
          { name: 'method', label: 'Method', type: 'select', options: PAYMENT_METHOD, default: 'upi', required: true },
          { name: 'reference', label: 'UTR / reference' },
          { name: 'paid_on', label: 'Paid on', type: 'date', default: today, required: true },
          { name: 'for_month', label: 'For month', type: 'date', default: monthStart, show: (f) => f.purpose === 'virtual_adoption', hint: 'Any date in the month it covers' },
          { name: 'status', label: 'Status', type: 'select', options: PAYMENT_STATUS, default: 'completed', required: true },
          { name: 'donor_pan', label: 'Donor PAN (for 80G)' },
          { name: 'receipt_number', label: 'Receipt no.', hint: 'Leave empty — it’s filled in when you confirm' },
          { name: 'notes', label: 'Notes', type: 'textarea' },
        ]}
        columns={[
          { label: 'Date', key: 'paid_on', render: (r) => fmtDate(r.paid_on), csv: (r) => r.paid_on },
          { label: 'From', text: (r) => `${r.donor_name} ${r.donor_email || ''}`, render: (r) => <span className="font-semibold">{r.donor_name}<span className="block text-xs font-normal text-ink-400">{r.donor_email || r.donor_phone}</span></span> },
          { label: 'For', text: (r) => label(PURPOSE, r.purpose), render: (r) => r.purpose === 'virtual_adoption' ? <span>Adoption · {r.virtual_adoptions?.dogs?.name || '—'}{r.for_month && <span className="block text-xs text-ink-400">{fmtDate(r.for_month, { month: 'short', year: 'numeric' })}</span>}</span> : 'Donation' },
          { label: 'Amount', key: 'amount', render: (r) => <b>{inr(r.amount)}</b> },
          { label: 'Method', text: (r) => label(PAYMENT_METHOD, r.method), render: (r) => <span>{label(PAYMENT_METHOD, r.method)}<span className="block font-mono text-xs text-ink-400">{r.reference}</span></span> },
          { label: 'UTR', key: 'reference', hidden: true },
          { label: 'Status', text: (r) => r.status, render: (r) => <Badge tone={r.status === 'completed' ? 'green' : r.status === 'failed' ? 'red' : 'amber'}>{label(PAYMENT_STATUS, r.status)}</Badge> },
          { label: 'Receipt', key: 'receipt_number', className: 'font-mono text-xs' },
        ]}
        search={['donor_name', 'donor_email', 'donor_phone', 'reference', 'receipt_number', (r) => r.virtual_adoptions?.dogs?.name]}
        filters={[
          { name: 'status', label: 'Statuses', options: PAYMENT_STATUS },
          { name: 'purpose', label: 'Purposes', options: PURPOSE },
          { name: 'method', label: 'Methods', options: PAYMENT_METHOD },
        ]}
        dateField="paid_on"
        csvName="payments-statement"
        beforeSave={async (row) => {
          if (row.status === 'completed' && !row.receipt_number) row.receipt_number = await nextReceiptNumber();
          if (row.purpose !== 'virtual_adoption') { row.virtual_adoption_id = null; row.for_month = null; }
          return row;
        }}
        rowClass={(r) => (r.status === 'pending' ? 'bg-marigold-50/60' : '')}
        summary={(rows) => {
          const done = rows.filter((r) => r.status === 'completed');
          const sum = (xs) => inr(xs.reduce((s, r) => s + Number(r.amount), 0));
          return (
            <div className="grid gap-3 sm:grid-cols-3">
              <Box k="Received (shown)" v={sum(done)} />
              <Box k="Virtual adoptions" v={sum(done.filter((r) => r.purpose === 'virtual_adoption'))} />
              <Box k="Donations" v={sum(done.filter((r) => r.purpose === 'donation'))} />
            </div>
          );
        }}
        rowActions={(r, reload) => (
          <>
            {r.status === 'pending' && <Button size="sm" onClick={() => confirm(r, reload)}>Confirm</Button>}
            {r.status === 'pending' && <Button size="sm" variant="ghost" onClick={() => fail(r, reload)}>Failed</Button>}
            {r.status === 'completed' && (
              <button className="rounded-lg p-2 hover:bg-wall-2" title="Download receipt" aria-label="Download receipt"
                onClick={async () => donationReceipt({ payment: r, settings: await getSettings(), number: r.receipt_number || `KHLT-${r.id.slice(0, 8).toUpperCase()}` })}>
                <Download className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      />
    </div>
  );
}

const Box = ({ k, v }) => (
  <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-wall-3">
    <p className="text-sm text-ink-400">{k}</p>
    <p className="font-display text-2xl font-extrabold">{v}</p>
  </div>
);
